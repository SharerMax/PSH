import type { ExpiryOption, PasteContent, PasteMeta, PasteUpdateInput } from '@psh/shared'
import type { Context } from 'hono'
import type { NewPasteRow, PasteRow } from '../db/schema'
import { zValidator } from '@hono/zod-validator'
import { pasteCreateInputSchema, pasteIdParamsSchema, pasteLinkParamsSchema, pasteUpdateInputSchema } from '@psh/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db'
import { pastes, pasteViews } from '../db/schema'
import { getSessionUser } from '../lib/auth'
import {
  decryptContent,
  DecryptionError,
  encryptContent,
  hashPassword,
  verifyPassword,
} from '../lib/crypto'
import { countryForIp, getRequestIp } from '../lib/geoip'
import { newPasteId } from '../lib/id'

const EXPIRY_MS: Partial<Record<ExpiryOption, number>> = {
  '10min': 10 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

function computeExpiry(expiresIn: string | undefined): Date | null {
  if (!expiresIn || expiresIn === 'forever') {
    return null
  }
  const ms = EXPIRY_MS[expiresIn as ExpiryOption]
  return ms ? new Date(Date.now() + ms) : null
}

export function isExpired(row: Pick<PasteRow, 'expiresAt'>): boolean {
  return row.expiresAt !== null && row.expiresAt.getTime() <= Date.now()
}

/** Record one access for statistics. Skipped for burn-after-read pastes. */
function recordView(c: Context, pasteId: number, burnAfterRead: boolean): void {
  if (burnAfterRead) {
    return
  }
  const ip = getRequestIp(c)
  const country = countryForIp(ip)
  db.insert(pasteViews)
    .values({ pasteId, country: country ?? 'unknown', ip: ip ?? null })
    .run()
}

function toMeta(row: PasteRow): PasteMeta {
  return {
    link: row.link,
    title: row.title,
    language: row.language,
    hasPassword: row.passwordHash !== null,
    burnAfterRead: row.burnAfterRead,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

function toContentPayload(row: PasteRow, content: string): PasteContent {
  return {
    link: row.link,
    title: row.title,
    language: row.language,
    content,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

/** Lazily delete an expired row; returns null when the row is gone. */
function expireCheck(row: PasteRow | undefined): PasteRow | null {
  if (!row) {
    return null
  }
  if (isExpired(row)) {
    db.delete(pastes).where(eq(pastes.id, row.id)).run()
    return null
  }
  return row
}

function getLiveRowByLink(link: string): PasteRow | null {
  const [row] = db.select().from(pastes).where(eq(pastes.link, link)).all()
  return expireCheck(row)
}

function getLiveRowById(id: number): PasteRow | null {
  const [row] = db.select().from(pastes).where(eq(pastes.id, id)).all()
  return expireCheck(row)
}

export type ReadResult
  = | { ok: true, row: PasteRow, content: string }
    | { ok: false, status: 400 | 401 | 404, message: string }

/**
 * Shared read path for the JSON content endpoint and the raw endpoint:
 * password verification/decryption, burn-after-read.
 */
export function readPaste(row: PasteRow, password?: string): ReadResult {
  let content: string
  if (row.passwordHash !== null) {
    if (!password || !verifyPassword(password, row.passwordHash)) {
      return { ok: false, status: 401, message: 'Invalid or missing password' }
    }
    try {
      content = decryptContent(
        {
          contentEnc: row.contentEnc ?? '',
          iv: row.iv ?? '',
          salt: row.salt ?? '',
          tag: row.tag ?? '',
        },
        password,
      )
    }
    catch (error) {
      if (error instanceof DecryptionError) {
        return { ok: false, status: 401, message: 'Invalid or missing password' }
      }
      throw error
    }
  }
  else {
    content = row.content ?? ''
  }

  if (row.burnAfterRead) {
    db.delete(pastes).where(eq(pastes.id, row.id)).run()
  }

  return { ok: true, row, content }
}

function readByLink(link: string, password?: string): ReadResult {
  const row = getLiveRowByLink(link)
  if (!row) {
    return { ok: false, status: 404, message: 'Paste not found or expired' }
  }
  return readPaste(row, password)
}

function readById(id: number, password?: string): ReadResult {
  const row = getLiveRowById(id)
  if (!row) {
    return { ok: false, status: 404, message: 'Paste not found or expired' }
  }
  return readPaste(row, password)
}

function buildNewRow(input: {
  title?: string
  language: string
  content: string
  expiresIn?: '10min' | '1h' | '1d' | '7d' | 'forever'
  password?: string
  burnAfterRead?: boolean
  link?: string
}, userId: string | null): NewPasteRow {
  const base = {
    link: input.link ?? newPasteId(),
    title: input.title || null,
    language: input.language,
    burnAfterRead: input.burnAfterRead ?? false,
    userId,
    expiresAt: computeExpiry(input.expiresIn),
  }

  if (input.password) {
    return {
      ...base,
      content: null,
      ...encryptContent(input.content, input.password),
      passwordHash: hashPassword(input.password),
    }
  }

  return { ...base, content: input.content }
}

/** Shared PATCH body for both /link/:link and /id/:id. */
function applyUpdate(c: Context, row: PasteRow, input: PasteUpdateInput): Response {
  const updates: Partial<NewPasteRow> = {}
  if (input.title !== undefined) {
    updates.title = input.title || null
  }
  if (input.language !== undefined) {
    updates.language = input.language
  }
  if (input.content !== undefined) {
    if (row.passwordHash !== null) {
      // re-encrypting requires the current paste password
      if (!input.password || !verifyPassword(input.password, row.passwordHash)) {
        return c.json({ error: 'Invalid or missing password' }, 401)
      }
      Object.assign(updates, encryptContent(input.content, input.password), {
        content: null,
      })
    }
    else {
      updates.content = input.content
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'Nothing to update' }, 400)
  }
  db.update(pastes).set(updates).where(eq(pastes.id, row.id)).run()
  return c.json(toMeta({ ...row, ...updates }))
}

/** Shared PATCH precondition checks for both /link/:link and /id/:id. */
function resolveUpdatable(c: Context, row: PasteRow | null): { row: PasteRow } | { response: Response } {
  const user = getSessionUser(c)
  if (!user) {
    return { response: c.json({ error: 'Not authenticated' }, 401) }
  }
  if (!row) {
    return { response: c.json({ error: 'Paste not found or expired' }, 404) }
  }
  if (row.userId !== user.id) {
    return { response: c.json({ error: 'Not the paste owner' }, 403) }
  }
  return { row }
}

export const apiRoutes = new Hono()
  .post(
    '/',
    zValidator('json', pasteCreateInputSchema),
    (c) => {
      const input = c.req.valid('json')
      if (input.link) {
        // a taken link blocks reuse even when the old paste is expired;
        // getLiveRowByLink lazily deletes expired rows, freeing them for reuse
        if (getLiveRowByLink(input.link)) {
          return c.json({ error: 'This custom link is already taken' }, 409)
        }
      }
      const user = getSessionUser(c)
      const row = buildNewRow(input, user?.id ?? null)
      db.insert(pastes).values(row).run()
      return c.json({ link: row.link }, 201)
    },
  )
  .patch(
    '/link/:link',
    zValidator('param', pasteLinkParamsSchema),
    zValidator('json', pasteUpdateInputSchema),
    (c) => {
      const { link } = c.req.valid('param')
      const resolved = resolveUpdatable(c, getLiveRowByLink(link))
      return 'response' in resolved
        ? resolved.response
        : applyUpdate(c, resolved.row, c.req.valid('json'))
    },
  )
  .patch(
    '/id/:id',
    zValidator('param', pasteIdParamsSchema),
    zValidator('json', pasteUpdateInputSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const resolved = resolveUpdatable(c, getLiveRowById(id))
      return 'response' in resolved
        ? resolved.response
        : applyUpdate(c, resolved.row, c.req.valid('json'))
    },
  )
  .get(
    '/link/:link/meta',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      const { link } = c.req.valid('param')
      const row = getLiveRowByLink(link)
      if (!row) {
        return c.json({ error: 'Paste not found or expired' }, 404)
      }
      return c.json(toMeta(row))
    },
  )
  .get(
    '/id/:id/meta',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const row = getLiveRowById(id)
      if (!row) {
        return c.json({ error: 'Paste not found or expired' }, 404)
      }
      return c.json(toMeta(row))
    },
  )
  .get(
    '/link/:link/content',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      const { link } = c.req.valid('param')
      const result = readByLink(link, c.req.query('password'))
      if (!result.ok) {
        return c.json({ error: result.message }, result.status)
      }
      recordView(c, result.row.id, result.row.burnAfterRead)
      return c.json(toContentPayload(result.row, result.content))
    },
  )
  .get(
    '/id/:id/content',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const result = readById(id, c.req.query('password'))
      if (!result.ok) {
        return c.json({ error: result.message }, result.status)
      }
      recordView(c, result.row.id, result.row.burnAfterRead)
      return c.json(toContentPayload(result.row, result.content))
    },
  )

export const rawRoutes = new Hono()
  .get(
    '/link/:link',
    zValidator('param', pasteLinkParamsSchema),
    (c) => {
      const { link } = c.req.valid('param')
      const result = readByLink(link, c.req.query('password'))
      if (!result.ok) {
        return c.text(result.message, result.status as 400 | 401 | 404)
      }
      recordView(c, result.row.id, result.row.burnAfterRead)
      return c.text(result.content, 200, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
    },
  )
  .get(
    '/id/:id',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const result = readById(id, c.req.query('password'))
      if (!result.ok) {
        return c.text(result.message, result.status as 400 | 401 | 404)
      }
      recordView(c, result.row.id, result.row.burnAfterRead)
      return c.text(result.content, 200, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
    },
  )

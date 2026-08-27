import type { ExpiryOption, PasteContent, PasteMeta } from '@psh/shared'
import type { Context } from 'hono'
import type { NewPasteRow, PasteRow } from '../db/schema'
import { zValidator } from '@hono/zod-validator'
import {

  pasteCreateInputSchema,
  pasteIdParamsSchema,
  pasteUpdateInputSchema,

} from '@psh/shared'
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
function recordView(c: Context, pasteId: string, burnAfterRead: boolean): void {
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
    id: row.id,
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
    id: row.id,
    title: row.title,
    language: row.language,
    content,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

/** Fetch a row, lazily deleting it if expired. Returns null when gone. */
function getLiveRow(id: string): PasteRow | null {
  const [row] = db.select().from(pastes).where(eq(pastes.id, id)).all()
  if (!row) {
    return null
  }
  if (isExpired(row)) {
    db.delete(pastes).where(eq(pastes.id, id)).run()
    return null
  }
  return row
}

export type ReadResult
  = | { ok: true, row: PasteRow, content: string }
    | { ok: false, status: 400 | 401 | 404, message: string }

/**
 * Shared read path for the JSON content endpoint and the raw endpoint:
 * lazy expiry check, password verification/decryption, burn-after-read.
 */
export function readPaste(id: string, password?: string): ReadResult {
  const row = getLiveRow(id)
  if (!row) {
    return { ok: false, status: 404, message: 'Paste not found or expired' }
  }

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
    db.delete(pastes).where(eq(pastes.id, id)).run()
  }

  return { ok: true, row, content }
}

function buildNewRow(input: {
  title?: string
  language: string
  content: string
  expiresIn?: '10min' | '1h' | '1d' | '7d' | 'forever'
  password?: string
  burnAfterRead?: boolean
}, userId: string | null): NewPasteRow {
  const base = {
    id: newPasteId(),
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

export const apiRoutes = new Hono()
  .post(
    '/',
    zValidator('json', pasteCreateInputSchema),
    (c) => {
      const input = c.req.valid('json')
      const user = getSessionUser(c)
      const row = buildNewRow(input, user?.id ?? null)
      db.insert(pastes).values(row).run()
      return c.json({ id: row.id }, 201)
    },
  )
  .patch(
    '/:id',
    zValidator('param', pasteIdParamsSchema),
    zValidator('json', pasteUpdateInputSchema),
    (c) => {
      const user = getSessionUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }
      const { id } = c.req.valid('param')
      const row = getLiveRow(id)
      if (!row) {
        return c.json({ error: 'Paste not found or expired' }, 404)
      }
      if (row.userId !== user.id) {
        return c.json({ error: 'Not the paste owner' }, 403)
      }

      const input = c.req.valid('json')
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
      db.update(pastes).set(updates).where(eq(pastes.id, id)).run()
      return c.json(toMeta({ ...row, ...updates }))
    },
  )
  .get(
    '/:id/meta',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const row = getLiveRow(id)
      if (!row) {
        return c.json({ error: 'Paste not found or expired' }, 404)
      }
      return c.json(toMeta(row))
    },
  )
  .get(
    '/:id/content',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const result = readPaste(id, c.req.query('password'))
      if (!result.ok) {
        return c.json({ error: result.message }, result.status)
      }
      recordView(c, id, result.row.burnAfterRead)
      return c.json(toContentPayload(result.row, result.content))
    },
  )

export const rawRoutes = new Hono()
  .get(
    '/:id',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const { id } = c.req.valid('param')
      const result = readPaste(id, c.req.query('password'))
      if (!result.ok) {
        return c.text(result.message, result.status as 400 | 401 | 404)
      }
      recordView(c, id, result.row.burnAfterRead)
      return c.text(result.content, 200, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
    },
  )

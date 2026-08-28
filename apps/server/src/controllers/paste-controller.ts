import type { PasteCreateInput, PasteUpdateInput } from '@psh/shared'
import type { Context } from 'hono'
import type { PasteRow } from '../db/schema'
import { getSessionToken } from '../lib/auth'
import { getRequestIp } from '../lib/geoip'
import { getSessionUser } from '../services/auth-service'
import {
  createPaste,
  getLivePasteById,
  getLivePasteByLink,
  readPasteById,
  readPasteByLink,
  toContentPayload,
  toMeta,
  updatePaste,
} from '../services/paste-service'
import { recordPasteView } from '../services/view-service'

export function create(c: Context, input: PasteCreateInput): Response {
  const user = getSessionUser(getSessionToken(c))
  const result = createPaste(input, user?.id ?? null)
  if (!result.ok) {
    return c.json({ error: 'This custom link is already taken' }, 409)
  }
  return c.json({ link: result.link }, 201)
}

/** Shared PATCH precondition checks for both /link/:link and /id/:id. */
function resolveUpdatable(c: Context, row: PasteRow | null): { row: PasteRow } | { response: Response } {
  const user = getSessionUser(getSessionToken(c))
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

export function patchByLink(c: Context, link: string, input: PasteUpdateInput): Response {
  const resolved = resolveUpdatable(c, getLivePasteByLink(link))
  if ('response' in resolved) {
    return resolved.response
  }
  const result = updatePaste(resolved.row, input)
  return result.ok ? c.json(result.meta) : c.json({ error: result.message }, result.status)
}

export function patchById(c: Context, id: number, input: PasteUpdateInput): Response {
  const resolved = resolveUpdatable(c, getLivePasteById(id))
  if ('response' in resolved) {
    return resolved.response
  }
  const result = updatePaste(resolved.row, input)
  return result.ok ? c.json(result.meta) : c.json({ error: result.message }, result.status)
}

export function metaByLink(c: Context, link: string): Response {
  const row = getLivePasteByLink(link)
  if (!row) {
    return c.json({ error: 'Paste not found or expired' }, 404)
  }
  return c.json(toMeta(row))
}

export function metaById(c: Context, id: number): Response {
  const row = getLivePasteById(id)
  if (!row) {
    return c.json({ error: 'Paste not found or expired' }, 404)
  }
  return c.json(toMeta(row))
}

export function contentByLink(c: Context, link: string, password?: string): Response {
  const result = readPasteByLink(link, password)
  if (!result.ok) {
    return c.json({ error: result.message }, result.status)
  }
  recordPasteView(result.row.id, result.row.burnAfterRead, getRequestIp(c))
  return c.json(toContentPayload(result.row, result.content))
}

export function contentById(c: Context, id: number, password?: string): Response {
  const result = readPasteById(id, password)
  if (!result.ok) {
    return c.json({ error: result.message }, result.status)
  }
  recordPasteView(result.row.id, result.row.burnAfterRead, getRequestIp(c))
  return c.json(toContentPayload(result.row, result.content))
}

function rawResponse(c: Context, result: ReturnType<typeof readPasteByLink>): Response {
  if (!result.ok) {
    return c.text(result.message, result.status as 400 | 401 | 404)
  }
  recordPasteView(result.row.id, result.row.burnAfterRead, getRequestIp(c))
  return c.text(result.content, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
  })
}

export function rawByLink(c: Context, link: string, password?: string): Response {
  return rawResponse(c, readPasteByLink(link, password))
}

export function rawById(c: Context, id: number, password?: string): Response {
  return rawResponse(c, readPasteById(id, password))
}

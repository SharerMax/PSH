import type { PasteViewsQuery } from '@psh/shared'
import type { Context } from 'hono'
import type { UserRow } from '../db/schema'
import { getLivePasteById, getOwnedPasteById } from '../services/paste-service'
import { getStats, getViewsPage } from '../services/view-service'

/**
 * Stats are owner-only, except admins may inspect any paste.
 * Admins also see stats of expired pastes (live rows only, lazily swept).
 */
function accessiblePaste(user: UserRow, id: number) {
  return user.role === 'admin' ? getLivePasteById(id) : getOwnedPasteById(id, user.id)
}

export function stats(c: Context, user: UserRow, id: number): Response {
  const row = accessiblePaste(user, id)
  if (!row) {
    return c.json({ error: 'Paste not found' }, 404)
  }
  return c.json(getStats(row))
}

export function views(c: Context, user: UserRow, id: number, query: PasteViewsQuery): Response {
  const row = accessiblePaste(user, id)
  if (!row) {
    return c.json({ error: 'Paste not found' }, 404)
  }
  return c.json(getViewsPage(row, query))
}

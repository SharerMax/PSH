import type { MineListQuery, PasteViewsQuery } from '@psh/shared'
import type { Context } from 'hono'
import { listUserFavorites } from '../services/favorite-service'
import { getOwnedPasteById, listUserPastes } from '../services/paste-service'
import { getStats, getViewsPage } from '../services/view-service'

export function listMine(c: Context, userId: string, query: MineListQuery): Response {
  return c.json(listUserPastes(userId, query))
}

export function listFavorites(c: Context, userId: string, query: MineListQuery): Response {
  return c.json(listUserFavorites(userId, query))
}

export function stats(c: Context, userId: string, id: number): Response {
  const row = getOwnedPasteById(id, userId)
  if (!row) {
    return c.json({ error: 'Paste not found' }, 404)
  }
  return c.json(getStats(row))
}

export function views(c: Context, userId: string, id: number, query: PasteViewsQuery): Response {
  const row = getOwnedPasteById(id, userId)
  if (!row) {
    return c.json({ error: 'Paste not found' }, 404)
  }
  return c.json(getViewsPage(row, query))
}

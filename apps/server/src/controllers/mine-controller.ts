import type { MineListQuery } from '@psh/shared'
import type { Context } from 'hono'
import { listUserFavorites } from '../services/favorite-service'
import { listUserPastes } from '../services/paste-service'

export function listMine(c: Context, userId: string, query: MineListQuery): Response {
  return c.json(listUserPastes(userId, query))
}

export function listFavorites(c: Context, userId: string, query: MineListQuery): Response {
  return c.json(listUserFavorites(userId, query))
}

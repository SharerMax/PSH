import type { Context } from 'hono'
import { getSessionToken } from '../lib/auth'
import { getSessionUser } from '../services/auth-service'
import {
  favoritePaste,
  getFavoriteStatus,
  unfavoritePaste,
} from '../services/favorite-service'

/** Favorites are user-scoped: an anonymous session gets 401 so the client can prompt login. */
function requireUserId(c: Context): string | null {
  return getSessionUser(getSessionToken(c))?.id ?? null
}

export function status(c: Context, link: string): Response {
  const userId = requireUserId(c)
  if (!userId) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  const result = getFavoriteStatus(userId, link)
  return result.ok ? c.json(result.status) : c.json({ error: result.message }, result.status)
}

export function add(c: Context, link: string): Response {
  const userId = requireUserId(c)
  if (!userId) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  const result = favoritePaste(userId, link)
  return result.ok ? c.json(result.status) : c.json({ error: result.message }, result.status)
}

export function remove(c: Context, link: string): Response {
  const userId = requireUserId(c)
  if (!userId) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  const result = unfavoritePaste(userId, link)
  return result.ok ? c.json(result.status) : c.json({ error: result.message }, result.status)
}

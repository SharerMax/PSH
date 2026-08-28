import type { Context, MiddlewareHandler } from 'hono'
import type { UserRow } from '../db/schema'
import { createMiddleware } from 'hono/factory'
import { getSessionToken } from '../lib/auth'
import { getSessionUser } from '../services/auth-service'

export interface UserEnv { Variables: { user: UserRow } }

/** Require an authenticated session and stash the user on the context. */
export function requireUser(): MiddlewareHandler<UserEnv> {
  return createMiddleware<UserEnv>(async (c, next) => {
    const user = getSessionUser(getSessionToken(c))
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401)
    }
    c.set('user', user)
    await next()
  })
}

export function getUser(c: Context<UserEnv>): UserRow {
  return c.get('user')
}

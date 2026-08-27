import type { Context } from 'hono'
import type { UserRow } from '../db/schema'
import { and, eq, gt, lt } from 'drizzle-orm'
import { getCookie } from 'hono/cookie'
import { db } from '../db'
import { sessions, users } from '../db/schema'
import { newSessionToken } from './id'

export const SESSION_COOKIE = 'psh_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface SessionCookieOptions {
  httpOnly: true
  sameSite: 'Lax'
  path: string
  maxAge: number
}

export const sessionCookieOptions: SessionCookieOptions = {
  httpOnly: true,
  sameSite: 'Lax',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
}

export function createSession(userId: string): string {
  const token = newSessionToken()
  db.insert(sessions)
    .values({ token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
    .run()
  return token
}

export function getSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}

/** Resolve the authenticated user from the session cookie, or null. */
export function getSessionUser(c: Context): UserRow | null {
  const token = getSessionToken(c)
  if (!token) {
    return null
  }
  const [row] = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .all()
  return row?.user ?? null
}

export function destroySession(c: Context): void {
  const token = getSessionToken(c)
  if (token) {
    db.delete(sessions).where(eq(sessions.token, token)).run()
  }
}

/** Remove expired sessions; invoked by the periodic cleanup sweep. */
export function purgeExpiredSessions(): number {
  const result = db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .run()
  return result.changes
}

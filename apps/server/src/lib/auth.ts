import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

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

export function getSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}

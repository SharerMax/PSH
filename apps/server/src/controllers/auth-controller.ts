import type { AuthInput, ChangePasswordInput } from '@psh/shared'
import type { Context } from 'hono'
import type { UserEnv } from '../middleware/auth'
import { setCookie } from 'hono/cookie'
import { getSessionToken, SESSION_COOKIE, sessionCookieOptions } from '../lib/auth'
import { getUser } from '../middleware/auth'
import {
  changePassword,
  createSession,
  destroySession,
  getSessionUser,
  loginUser,
  registerUser,
} from '../services/auth-service'

function toUser(user: { id: string, username: string }): { id: string, username: string } {
  return { id: user.id, username: user.username }
}

export function register(c: Context, input: AuthInput): Response {
  const result = registerUser(input)
  if (!result.ok) {
    return c.json({ error: 'Username already taken' }, 409)
  }
  setCookie(c, SESSION_COOKIE, createSession(result.user.id), sessionCookieOptions)
  return c.json(toUser(result.user), 201)
}

export function login(c: Context, input: AuthInput): Response {
  const result = loginUser(input)
  if (!result.ok) {
    return c.json({ error: 'Invalid username or password' }, 401)
  }
  setCookie(c, SESSION_COOKIE, createSession(result.user.id), sessionCookieOptions)
  return c.json(toUser(result.user))
}

export function logout(c: Context): Response {
  destroySession(getSessionToken(c))
  return c.json({ ok: true })
}

export function me(c: Context): Response {
  const user = getSessionUser(getSessionToken(c))
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  return c.json(toUser(user))
}

export function changeUserPassword(c: Context<UserEnv>, input: ChangePasswordInput): Response {
  const result = changePassword(getUser(c).id, getSessionToken(c) ?? '', input)
  if (!result.ok) {
    return c.json({ error: 'Current password is incorrect' }, 403)
  }
  return c.json({ ok: true })
}

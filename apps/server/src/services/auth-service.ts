import type { UserRow } from '../db/schema'
import { SESSION_TTL_MS } from '../lib/auth'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { newSessionToken, newUserId } from '../lib/id'
import {
  deleteSessionByToken,
  findUserByToken,
  insertSession,
} from '../repositories/session-repository'
import { findUserByUsername, insertUser } from '../repositories/user-repository'

export interface AuthUser {
  id: string
  username: string
}

export type AuthResult
  = | { ok: true, user: AuthUser }
    | { ok: false, error: 'username-taken' | 'invalid-credentials' }

export function registerUser(input: { username: string, password: string }): AuthResult {
  if (findUserByUsername(input.username)) {
    return { ok: false, error: 'username-taken' }
  }
  const id = newUserId()
  insertUser({ id, username: input.username, passwordHash: hashPassword(input.password) })
  return { ok: true, user: { id, username: input.username } }
}

export function loginUser(input: { username: string, password: string }): AuthResult {
  const user = findUserByUsername(input.username)
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { ok: false, error: 'invalid-credentials' }
  }
  return { ok: true, user: { id: user.id, username: user.username } }
}

export function createSession(userId: string): string {
  const token = newSessionToken()
  insertSession({ token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
  return token
}

/** Resolve the authenticated user from the session token, or null. */
export function getSessionUser(token: string | undefined): UserRow | null {
  if (!token) {
    return null
  }
  return findUserByToken(token)
}

export function destroySession(token: string | undefined): void {
  if (token) {
    deleteSessionByToken(token)
  }
}

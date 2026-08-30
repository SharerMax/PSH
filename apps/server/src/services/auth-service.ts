import type { UserRole, UserRow } from '../db/schema'
import { SESSION_TTL_MS } from '../lib/auth'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { newSessionToken, newUserId } from '../lib/id'
import {
  deleteOtherUserSessions,
  deleteSessionByToken,
  findUserByToken,
  insertSession,
} from '../repositories/session-repository'
import {
  existsAnyUser,
  findUserById,
  findUserByUsername,
  insertUser,
  updateUserPassword,
} from '../repositories/user-repository'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

export type AuthResult
  = | { ok: true, user: AuthUser }
    | { ok: false, error: 'username-taken' | 'invalid-credentials' | 'account-banned' }

export function registerUser(input: { username: string, password: string }): AuthResult {
  if (findUserByUsername(input.username)) {
    return { ok: false, error: 'username-taken' }
  }
  const id = newUserId()
  // the first registered user becomes the administrator
  const role: UserRole = existsAnyUser() ? 'user' : 'admin'
  insertUser({ id, username: input.username, passwordHash: hashPassword(input.password), role })
  return { ok: true, user: { id, username: input.username, role } }
}

export function loginUser(input: { username: string, password: string }): AuthResult {
  const user = findUserByUsername(input.username)
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { ok: false, error: 'invalid-credentials' }
  }
  if (user.banned) {
    return { ok: false, error: 'account-banned' }
  }
  return { ok: true, user: { id: user.id, username: user.username, role: user.role } }
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

export type ChangePasswordResult
  = | { ok: true }
    | { ok: false, error: 'wrong-current-password' }

/** Verify the current password, then rotate the hash and revoke other sessions. */
export function changePassword(
  userId: string,
  currentToken: string,
  input: { currentPassword: string, newPassword: string },
): ChangePasswordResult {
  const user = findUserById(userId)
  if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
    return { ok: false, error: 'wrong-current-password' }
  }
  updateUserPassword(userId, hashPassword(input.newPassword))
  deleteOtherUserSessions(userId, currentToken)
  return { ok: true }
}

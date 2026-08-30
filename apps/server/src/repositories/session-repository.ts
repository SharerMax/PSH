import type { UserRow } from '../db/schema'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import { db } from '../db'
import { sessions, users } from '../db/schema'

export function insertSession(values: {
  token: string
  userId: string
  expiresAt: Date
}): void {
  db.insert(sessions).values(values).run()
}

/** Resolve the user owning a valid (non-expired) session token, or null. */
export function findUserByToken(token: string): UserRow | null {
  const [row] = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .all()
  return row?.user ?? null
}

export function deleteSessionByToken(token: string): void {
  db.delete(sessions).where(eq(sessions.token, token)).run()
}

/** Revoke every session of a user except the given (current) token. */
export function deleteOtherUserSessions(userId: string, keepToken: string): number {
  return db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.token, keepToken)))
    .run()
    .changes
}

/** Revoke every session of a user (e.g. after ban or password reset). */
export function deleteAllUserSessions(userId: string): number {
  return db.delete(sessions).where(eq(sessions.userId, userId)).run().changes
}

export function deleteExpiredSessions(): number {
  return db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .run()
    .changes
}

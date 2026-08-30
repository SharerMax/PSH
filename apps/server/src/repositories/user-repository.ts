import type { NewUserRow, UserRow } from '../db/schema'
import { asc, count, eq, like } from 'drizzle-orm'
import { db } from '../db'
import { pastes, users } from '../db/schema'

export function findUserByUsername(username: string): UserRow | undefined {
  return db.select().from(users).where(eq(users.username, username)).all()[0]
}

export function findUserById(id: string): UserRow | undefined {
  return db.select().from(users).where(eq(users.id, id)).all()[0]
}

export function existsAnyUser(): boolean {
  return db.select({ id: users.id }).from(users).limit(1).all().length > 0
}

export function insertUser(values: NewUserRow): void {
  db.insert(users).values(values).run()
}

export function updateUserPassword(id: string, passwordHash: string): void {
  db.update(users).set({ passwordHash }).where(eq(users.id, id)).run()
}

export function updateUserBanned(id: string, banned: boolean): void {
  db.update(users).set({ banned }).where(eq(users.id, id)).run()
}

export function deleteUser(id: string): void {
  db.delete(users).where(eq(users.id, id)).run()
}

export interface UserListFilter {
  offset: number
  limit: number
  q?: string
}

/** Paginated users (oldest first) with their paste counts. */
export function listUsersPage(filter: UserListFilter): { rows: Array<UserRow & { pasteCount: number }>, total: number } {
  const where = filter.q ? like(users.username, `%${filter.q}%`) : undefined
  const rows = db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      role: users.role,
      banned: users.banned,
      createdAt: users.createdAt,
      pasteCount: count(pastes.id),
    })
    .from(users)
    .leftJoin(pastes, eq(pastes.userId, users.id))
    .where(where)
    .groupBy(users.id)
    .orderBy(asc(users.createdAt))
    .limit(filter.limit)
    .offset(filter.offset)
    .all()
  const total = db
    .select({ value: count() })
    .from(users)
    .where(where)
    .all()[0]
    ?.value ?? 0
  return { rows, total }
}

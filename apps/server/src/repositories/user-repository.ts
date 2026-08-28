import type { NewUserRow, UserRow } from '../db/schema'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'

export function findUserByUsername(username: string): UserRow | undefined {
  return db.select().from(users).where(eq(users.username, username)).all()[0]
}

export function insertUser(values: NewUserRow): void {
  db.insert(users).values(values).run()
}

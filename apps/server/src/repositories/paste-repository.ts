import type { NewPasteRow, PasteRow } from '../db/schema'
import { and, eq, isNotNull, lt } from 'drizzle-orm'
import { db } from '../db'
import { pastes } from '../db/schema'

export function findPasteByLink(link: string): PasteRow | undefined {
  return db.select().from(pastes).where(eq(pastes.link, link)).all()[0]
}

export function findPasteById(id: number): PasteRow | undefined {
  return db.select().from(pastes).where(eq(pastes.id, id)).all()[0]
}

export function insertPaste(values: NewPasteRow): void {
  db.insert(pastes).values(values).run()
}

export function updatePasteById(id: number, values: Partial<NewPasteRow>): void {
  db.update(pastes).set(values).where(eq(pastes.id, id)).run()
}

export function deletePasteById(id: number): void {
  db.delete(pastes).where(eq(pastes.id, id)).run()
}

export function deleteExpiredPastes(): number {
  return db
    .delete(pastes)
    .where(and(isNotNull(pastes.expiresAt), lt(pastes.expiresAt, new Date())))
    .run()
    .changes
}

export function listPastesByUserId(userId: string): PasteRow[] {
  return db.select().from(pastes).where(eq(pastes.userId, userId)).all()
}

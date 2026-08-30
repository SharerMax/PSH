import type { NewPasteRow, PasteRow } from '../db/schema'
import { and, count, desc, eq, gt, gte, isNotNull, isNull, like, lt, lte, or } from 'drizzle-orm'
import { db } from '../db'
import { pastes } from '../db/schema'

export interface PastePageFilter {
  offset: number
  limit: number
  q?: string
  language?: string
  from?: Date
  to?: Date
}

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

function pastePageWhere(userId: string, filter: PastePageFilter) {
  const conditions = [
    eq(pastes.userId, userId),
    // live rows only: expired ones are either lazily deleted or swept later
    or(isNull(pastes.expiresAt), gt(pastes.expiresAt, new Date())),
  ]
  if (filter.q) {
    // SQLite LIKE is case-insensitive for ASCII
    const pattern = `%${filter.q}%`
    conditions.push(or(like(pastes.title, pattern), like(pastes.link, pattern)))
  }
  if (filter.language) {
    conditions.push(eq(pastes.language, filter.language))
  }
  if (filter.from) {
    conditions.push(gte(pastes.createdAt, filter.from))
  }
  if (filter.to) {
    conditions.push(lte(pastes.createdAt, filter.to))
  }
  return and(...conditions)
}

export function listPastesPageByUserId(userId: string, filter: PastePageFilter): { rows: PasteRow[], total: number } {
  const where = pastePageWhere(userId, filter)
  const rows = db
    .select()
    .from(pastes)
    .where(where)
    .orderBy(desc(pastes.createdAt))
    .limit(filter.limit)
    .offset(filter.offset)
    .all()
  const total = db
    .select({ value: count() })
    .from(pastes)
    .where(where)
    .all()[0]
    ?.value ?? 0
  return { rows, total }
}

import type { NewFavoriteRow } from '../db/schema'
import type { PastePageFilter } from './paste-repository'
import { and, count, desc, eq, gt, gte, isNull, like, lte, or } from 'drizzle-orm'
import { db } from '../db'
import { favorites, pastes } from '../db/schema'

export function findFavoriteByUserAndPaste(userId: string, pasteId: number) {
  return db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.pasteId, pasteId)))
    .all()[0]
}

export function insertFavorite(values: NewFavoriteRow): void {
  db.insert(favorites).values(values).onConflictDoNothing().run()
}

export function deleteFavorite(userId: string, pasteId: number): void {
  db.delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.pasteId, pasteId)))
    .run()
}

export function listFavoritePastesByUserId(userId: string) {
  return db
    .select({ paste: pastes, favoritedAt: favorites.createdAt })
    .from(favorites)
    .innerJoin(pastes, eq(favorites.pasteId, pastes.id))
    .where(eq(favorites.userId, userId))
    .all()
}

function favoritePageWhere(userId: string, filter: PastePageFilter) {
  const conditions = [
    eq(favorites.userId, userId),
    // live pastes only
    or(isNull(pastes.expiresAt), gt(pastes.expiresAt, new Date())),
  ]
  if (filter.q) {
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

export function listFavoritesPageByUserId(userId: string, filter: PastePageFilter): { rows: { paste: typeof pastes.$inferSelect, favoritedAt: Date }[], total: number } {
  const where = favoritePageWhere(userId, filter)
  const rows = db
    .select({ paste: pastes, favoritedAt: favorites.createdAt })
    .from(favorites)
    .innerJoin(pastes, eq(favorites.pasteId, pastes.id))
    .where(where)
    .orderBy(desc(favorites.createdAt))
    .limit(filter.limit)
    .offset(filter.offset)
    .all()
  const total = db
    .select({ value: count() })
    .from(favorites)
    .innerJoin(pastes, eq(favorites.pasteId, pastes.id))
    .where(where)
    .all()[0]
    ?.value ?? 0
  return { rows, total }
}

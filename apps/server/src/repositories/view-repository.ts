import type { SQL } from 'drizzle-orm'
import type { PasteViewRow } from '../db/schema'
import { count, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { pastes, pasteViews, users } from '../db/schema'

export interface ViewAggregate {
  views: number
  lastViewedAt: number | null
}

export function insertPasteView(values: {
  pasteId: number
  country: string
  ip: string | null
}): void {
  db.insert(pasteViews).values(values).run()
}

export function getViewAggregate(pasteId: number): ViewAggregate {
  const [agg] = db
    .select({
      views: sql<number>`count(*)`.mapWith(Number),
      lastViewedAt: sql<number | null>`max(${pasteViews.viewedAt})`.mapWith(value =>
        value === null ? null : Number(value),
      ),
    })
    .from(pasteViews)
    .where(eq(pasteViews.pasteId, pasteId))
    .all()
  return { views: agg?.views ?? 0, lastViewedAt: agg?.lastViewedAt ?? null }
}

export function listCountryCounts(pasteId: number): { country: string, count: number }[] {
  return db
    .select({
      country: pasteViews.country,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(pasteViews)
    .where(eq(pasteViews.pasteId, pasteId))
    .groupBy(pasteViews.country)
    .orderBy(desc(sql`count(*)`))
    .all()
}

export function countViews(where: SQL | undefined): number {
  const [row] = db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(pasteViews)
    .where(where)
    .all()
  return row?.count ?? 0
}

export function listViews(where: SQL | undefined, limit: number, offset: number): PasteViewRow[] {
  return db
    .select()
    .from(pasteViews)
    .where(where)
    .orderBy(desc(pasteViews.viewedAt))
    .limit(limit)
    .offset(offset)
    .all()
}

export function listRecentViews(pasteId: number, limit: number): PasteViewRow[] {
  return listViews(eq(pasteViews.pasteId, pasteId), limit, 0)
}

export function countAllViews(): number {
  return db.select({ value: count() }).from(pasteViews).all()[0]?.value ?? 0
}

/** Country distribution across all pastes, most viewed first. */
export function listAllCountryCounts(): { country: string, count: number }[] {
  return db
    .select({
      country: pasteViews.country,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(pasteViews)
    .groupBy(pasteViews.country)
    .orderBy(desc(sql`count(*)`))
    .all()
}

/** Most recent views with their paste and author, newest first. */
export function listRecentViewsGlobal(limit: number): GlobalViewRow[] {
  return globalViewsQuery()
    .orderBy(desc(pasteViews.viewedAt), desc(pasteViews.id))
    .limit(limit)
    .all()
}

export interface GlobalViewRow {
  pasteId: number
  link: string
  title: string | null
  username: string | null
  viewedAt: Date
  ip: string | null
  country: string
}

function globalViewsQuery() {
  return db
    .select({
      pasteId: pastes.id,
      link: pastes.link,
      title: pastes.title,
      username: users.username,
      viewedAt: pasteViews.viewedAt,
      ip: pasteViews.ip,
      country: pasteViews.country,
    })
    .from(pasteViews)
    .innerJoin(pastes, eq(pasteViews.pasteId, pastes.id))
    .leftJoin(users, eq(pastes.userId, users.id))
}

/** Paginated site-wide view records, newest first. */
export function listGlobalViews(where: SQL | undefined, limit: number, offset: number): GlobalViewRow[] {
  return globalViewsQuery()
    .where(where)
    .orderBy(desc(pasteViews.viewedAt), desc(pasteViews.id))
    .limit(limit)
    .offset(offset)
    .all()
}

/** Distinct country codes recorded across all views, alphabetical. */
export function listGlobalCountries(): string[] {
  return db
    .selectDistinct({ country: pasteViews.country })
    .from(pasteViews)
    .orderBy(pasteViews.country)
    .all()
    .map(row => row.country)
}

/** Top viewed pastes with the author username, most viewed first. */
export function listTopPastesByViews(limit: number): Array<{
  id: number
  link: string
  title: string | null
  username: string | null
  views: number
}> {
  return db
    .select({
      id: pastes.id,
      link: pastes.link,
      title: pastes.title,
      username: users.username,
      views: sql<number>`count(*)`.mapWith(Number),
    })
    .from(pasteViews)
    .innerJoin(pastes, eq(pasteViews.pasteId, pastes.id))
    .leftJoin(users, eq(pastes.userId, users.id))
    .groupBy(pastes.id, pastes.link, pastes.title, users.username)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
    .all()
}

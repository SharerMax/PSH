import type { SQL } from 'drizzle-orm'
import type { PasteViewRow } from '../db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { pasteViews } from '../db/schema'

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

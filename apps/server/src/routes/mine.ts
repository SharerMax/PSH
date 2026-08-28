import type { MyPasteItem, PasteStats, PasteViewsPage } from '@psh/shared'
import type { SQL } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import type { UserRow } from '../db/schema'
import { zValidator } from '@hono/zod-validator'
import { pasteIdParamsSchema, pasteViewsQuerySchema } from '@psh/shared'
import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { db } from '../db'
import { pastes, pasteViews } from '../db/schema'
import { getSessionUser } from '../lib/auth'
import { isGeoEnabled } from '../lib/geoip'
import { isExpired } from './pastes'

/** Require an authenticated session and stash the user on the context. */
function requireUser(): MiddlewareHandler<{ Variables: { user: UserRow } }> {
  return createMiddleware<{ Variables: { user: UserRow } }>(async (c, next) => {
    const user = getSessionUser(c)
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401)
    }
    c.set('user', user)
    await next()
  })
}

function getUser(c: Context<{ Variables: { user: UserRow } }>): UserRow {
  return c.get('user')
}

interface ViewAggregates {
  views: number
  lastViewedAt: number | null
}

function getViewAggregates(pasteId: number): ViewAggregates {
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

export const mineRoutes = new Hono<{ Variables: { user: UserRow } }>()
  .use('*', requireUser())
  .get('/', (c) => {
    const user = getUser(c)
    const rows = db.select().from(pastes).where(eq(pastes.userId, user.id)).all()

    const items: MyPasteItem[] = []
    for (const row of rows) {
      if (isExpired(row)) {
        db.delete(pastes).where(eq(pastes.id, row.id)).run()
        continue
      }
      const { views, lastViewedAt } = getViewAggregates(row.id)
      items.push({
        id: row.id,
        link: row.link,
        title: row.title,
        language: row.language,
        hasPassword: row.passwordHash !== null,
        burnAfterRead: row.burnAfterRead,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        views,
        lastViewedAt: lastViewedAt === null ? null : new Date(lastViewedAt).toISOString(),
      })
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return c.json(items)
  })
  .get(
    '/:id/stats',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      const user = getUser(c)
      const { id } = c.req.valid('param')
      const [row] = db.select().from(pastes).where(eq(pastes.id, id)).all()
      if (!row || row.userId !== user.id || isExpired(row)) {
        return c.json({ error: 'Paste not found' }, 404)
      }

      const [total] = db
        .select({
          views: sql<number>`count(*)`.mapWith(Number),
          lastViewedAt: sql<number | null>`max(${pasteViews.viewedAt})`.mapWith(value =>
            value === null ? null : Number(value),
          ),
        })
        .from(pasteViews)
        .where(eq(pasteViews.pasteId, row.id))
        .all()

      const byCountryRows = db
        .select({
          country: pasteViews.country,
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(pasteViews)
        .where(eq(pasteViews.pasteId, row.id))
        .groupBy(pasteViews.country)
        .orderBy(desc(sql`count(*)`))
        .all()

      const recentRows = db
        .select({
          viewedAt: pasteViews.viewedAt,
          ip: pasteViews.ip,
          country: pasteViews.country,
        })
        .from(pasteViews)
        .where(eq(pasteViews.pasteId, row.id))
        .orderBy(desc(pasteViews.viewedAt))
        .limit(50)
        .all()

      const geoEnabled = isGeoEnabled()
      const stats: PasteStats = {
        id: row.id,
        link: row.link,
        totalViews: total?.views ?? 0,
        lastViewedAt:
          total?.lastViewedAt === null || total?.lastViewedAt === undefined
            ? null
            : new Date(total.lastViewedAt).toISOString(),
        geoEnabled,
        byCountry: geoEnabled
          ? byCountryRows
          : [],
        recent: recentRows.map(row => ({
          viewedAt: row.viewedAt.toISOString(),
          ip: row.ip,
          country: row.country,
        })),
      }
      return c.json(stats)
    },
  )
  .get(
    '/:id/views',
    zValidator('param', pasteIdParamsSchema),
    zValidator('query', pasteViewsQuerySchema),
    (c) => {
      const user = getUser(c)
      const { id } = c.req.valid('param')
      const [row] = db.select().from(pastes).where(eq(pastes.id, id)).all()
      if (!row || row.userId !== user.id || isExpired(row)) {
        return c.json({ error: 'Paste not found' }, 404)
      }

      const query = c.req.valid('query')
      const conditions: SQL[] = [eq(pasteViews.pasteId, row.id)]
      if (query.country) {
        conditions.push(eq(pasteViews.country, query.country))
      }
      if (query.ip) {
        conditions.push(like(pasteViews.ip, `%${query.ip}%`))
      }
      if (query.from) {
        conditions.push(gte(pasteViews.viewedAt, new Date(query.from)))
      }
      if (query.to) {
        conditions.push(lte(pasteViews.viewedAt, new Date(query.to)))
      }
      const where = and(...conditions)

      const [total] = db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(pasteViews)
        .where(where)
        .all()

      const rows = db
        .select({
          viewedAt: pasteViews.viewedAt,
          ip: pasteViews.ip,
          country: pasteViews.country,
        })
        .from(pasteViews)
        .where(where)
        .orderBy(desc(pasteViews.viewedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .all()

      const page: PasteViewsPage = {
        total: total?.count ?? 0,
        page: query.page,
        pageSize: query.pageSize,
        rows: rows.map(row => ({
          viewedAt: row.viewedAt.toISOString(),
          ip: row.ip,
          country: row.country,
        })),
      }
      return c.json(page)
    },
  )

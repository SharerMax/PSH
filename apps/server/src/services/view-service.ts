import type { AdminViewsPage, PasteStats, PasteViewsPage, PasteViewsQuery } from '@psh/shared'
import type { SQL } from 'drizzle-orm'
import type { PasteRow } from '../db/schema'
import { and, eq, gte, like, lte } from 'drizzle-orm'
import { pasteViews } from '../db/schema'
import { countryForIp, isGeoEnabled } from '../lib/geoip'
import {
  countViews,
  getViewAggregate,
  insertPasteView,
  listCountryCounts,
  listGlobalCountries,
  listGlobalViews,
  listRecentViews,
  listViews,
} from '../repositories/view-repository'

/** Record one access for statistics. Skipped for burn-after-read pastes. */
export function recordPasteView(pasteId: number, burnAfterRead: boolean, ip: string | undefined): void {
  if (burnAfterRead) {
    return
  }
  const country = countryForIp(ip)
  insertPasteView({ pasteId, country: country ?? 'unknown', ip: ip ?? null })
}

export function getStats(row: PasteRow): PasteStats {
  const { views, lastViewedAt } = getViewAggregate(row.id)
  const byCountryRows = listCountryCounts(row.id)
  const recentRows = listRecentViews(row.id, 50)

  const geoEnabled = isGeoEnabled()
  return {
    id: row.id,
    link: row.link,
    totalViews: views,
    lastViewedAt:
      lastViewedAt === null
        ? null
        : new Date(lastViewedAt).toISOString(),
    geoEnabled,
    byCountry: geoEnabled ? byCountryRows : [],
    recent: recentRows.map(row => ({
      viewedAt: row.viewedAt.toISOString(),
      ip: row.ip,
      country: row.country,
    })),
  }
}

export function getViewsPage(row: PasteRow, query: PasteViewsQuery): PasteViewsPage {
  const where = and(eq(pasteViews.pasteId, row.id), ...filterConditions(query))

  const total = countViews(where)
  const rows = listViews(where, query.pageSize, (query.page - 1) * query.pageSize)

  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    rows: rows.map(row => ({
      viewedAt: row.viewedAt.toISOString(),
      ip: row.ip,
      country: row.country,
    })),
  }
}

function filterConditions(query: PasteViewsQuery): SQL[] {
  const conditions: SQL[] = []
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
  return conditions
}

/** Site-wide paginated view records for the admin access log. */
export function getGlobalViewsPage(query: PasteViewsQuery): AdminViewsPage {
  const conditions = filterConditions(query)
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = countViews(where)
  const rows = listGlobalViews(where, query.pageSize, (query.page - 1) * query.pageSize)

  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    countries: isGeoEnabled() ? listGlobalCountries() : [],
    rows: rows.map(row => ({
      pasteId: row.pasteId,
      link: row.link,
      title: row.title,
      username: row.username,
      viewedAt: row.viewedAt.toISOString(),
      ip: row.ip,
      country: row.country,
    })),
  }
}

import type { FavoriteListPage, FavoriteStatus, MineListQuery } from '@psh/shared'
import {
  deleteFavorite,
  findFavoriteByUserAndPaste,
  insertFavorite,
  listFavoritesPageByUserId,
} from '../repositories/favorite-repository'
import { getLivePasteByLink } from './paste-service'

export type FavoriteResult
  = | { ok: true, status: FavoriteStatus }
    | { ok: false, status: 404, message: string }

/** Resolve a live paste by public link, shared by all favorite operations. */
function requireLivePasteId(link: string): { ok: true, pasteId: number } | { ok: false, message: string } {
  const row = getLivePasteByLink(link)
  if (!row) {
    return { ok: false, message: 'Paste not found or expired' }
  }
  return { ok: true, pasteId: row.id }
}

export function getFavoriteStatus(userId: string, link: string): FavoriteResult {
  const resolved = requireLivePasteId(link)
  if (!resolved.ok) {
    return { ok: false, status: 404, message: resolved.message }
  }
  return {
    ok: true,
    status: { favorited: findFavoriteByUserAndPaste(userId, resolved.pasteId) !== undefined },
  }
}

export function favoritePaste(userId: string, link: string): FavoriteResult {
  const resolved = requireLivePasteId(link)
  if (!resolved.ok) {
    return { ok: false, status: 404, message: resolved.message }
  }
  insertFavorite({ userId, pasteId: resolved.pasteId })
  return { ok: true, status: { favorited: true } }
}

export function unfavoritePaste(userId: string, link: string): FavoriteResult {
  const resolved = requireLivePasteId(link)
  if (!resolved.ok) {
    return { ok: false, status: 404, message: resolved.message }
  }
  deleteFavorite(userId, resolved.pasteId)
  return { ok: true, status: { favorited: false } }
}

/** List the user's favorites (paginated, live pastes only). */
export function listUserFavorites(userId: string, query: MineListQuery): FavoriteListPage {
  const filter = {
    offset: (query.page - 1) * query.pageSize,
    limit: query.pageSize,
    q: query.q || undefined,
    language: query.language || undefined,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  }
  const { rows, total } = listFavoritesPageByUserId(userId, filter)

  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    rows: rows.map(({ paste: row, favoritedAt }) => ({
      id: row.id,
      link: row.link,
      title: row.title,
      language: row.language,
      hasPassword: row.passwordHash !== null,
      burnAfterRead: row.burnAfterRead,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      favoritedAt: favoritedAt.toISOString(),
    })),
  }
}

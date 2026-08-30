import type { AdminPasteListPage, AdminUserListPage, AdminUserUpdateInput, MineListQuery } from '@psh/shared'
import { db } from '../db'
import { hashPassword } from '../lib/crypto'
import {
  deletePasteById,
  deletePastesByUserId,
  findPasteById,
  listPastesPageForAdmin,
} from '../repositories/paste-repository'
import { deleteAllUserSessions } from '../repositories/session-repository'
import {
  deleteUser as deleteUserById,
  findUserById,
  listUsersPage,
  updateUserBanned,
  updateUserPassword,
} from '../repositories/user-repository'
import { getViewAggregate } from '../repositories/view-repository'

export function listUsers(query: { page: number, pageSize: number, q?: string }): AdminUserListPage {
  const { rows, total } = listUsersPage({
    offset: (query.page - 1) * query.pageSize,
    limit: query.pageSize,
    q: query.q || undefined,
  })
  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    rows: rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role,
      banned: row.banned,
      createdAt: row.createdAt.toISOString(),
      pasteCount: row.pasteCount,
    })),
  }
}

export type AdminUserMutationResult
  = | { ok: true }
    | { ok: false, error: 'user-not-found' | 'cannot-target-self' }

/** Ban/unban (revokes all sessions) and/or reset the password (revokes all sessions). */
export function updateUser(operatorId: string, userId: string, input: AdminUserUpdateInput): AdminUserMutationResult {
  const user = findUserById(userId)
  if (!user) {
    return { ok: false, error: 'user-not-found' }
  }
  if (userId === operatorId && input.banned !== undefined) {
    return { ok: false, error: 'cannot-target-self' }
  }
  if (input.banned !== undefined) {
    updateUserBanned(userId, input.banned)
    deleteAllUserSessions(userId)
  }
  if (input.password !== undefined) {
    updateUserPassword(userId, hashPassword(input.password))
    deleteAllUserSessions(userId)
  }
  return { ok: true }
}

/** Delete a user together with all of their pastes (views/favorites cascade). */
export function deleteUser(operatorId: string, userId: string): AdminUserMutationResult {
  if (userId === operatorId) {
    return { ok: false, error: 'cannot-target-self' }
  }
  const user = findUserById(userId)
  if (!user) {
    return { ok: false, error: 'user-not-found' }
  }
  db.transaction(() => {
    deletePastesByUserId(userId)
    deleteUserById(userId)
  })
  return { ok: true }
}

export function listPastes(query: MineListQuery): AdminPasteListPage {
  const { rows, total } = listPastesPageForAdmin({
    offset: (query.page - 1) * query.pageSize,
    limit: query.pageSize,
    q: query.q || undefined,
    language: query.language || undefined,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  })
  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    rows: rows.map(({ paste: row, username }) => {
      const { views, lastViewedAt } = getViewAggregate(row.id)
      return {
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
        username,
      }
    }),
  }
}

export function deletePaste(id: number): boolean {
  const row = findPasteById(id)
  if (!row) {
    return false
  }
  deletePasteById(id)
  return true
}

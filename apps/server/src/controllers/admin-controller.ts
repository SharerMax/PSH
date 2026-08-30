import type { AdminUserListQuery, AdminUserUpdateInput, MineListQuery } from '@psh/shared'
import type { Context } from 'hono'
import * as adminService from '../services/admin-service'

export function listUsers(c: Context, query: AdminUserListQuery): Response {
  return c.json(adminService.listUsers(query))
}

export function updateUser(c: Context, operatorId: string, userId: string, input: AdminUserUpdateInput): Response {
  const result = adminService.updateUser(operatorId, userId, input)
  if (!result.ok) {
    return result.error === 'cannot-target-self'
      ? c.json({ error: 'Cannot target yourself' }, 400)
      : c.json({ error: 'User not found' }, 404)
  }
  return c.json({ ok: true })
}

export function deleteUser(c: Context, operatorId: string, userId: string): Response {
  const result = adminService.deleteUser(operatorId, userId)
  if (!result.ok) {
    return result.error === 'cannot-target-self'
      ? c.json({ error: 'Cannot target yourself' }, 400)
      : c.json({ error: 'User not found' }, 404)
  }
  return c.json({ ok: true })
}

export function listPastes(c: Context, query: MineListQuery): Response {
  return c.json(adminService.listPastes(query))
}

export function deletePaste(c: Context, id: number): Response {
  if (!adminService.deletePaste(id)) {
    return c.json({ error: 'Paste not found' }, 404)
  }
  return c.json({ ok: true })
}

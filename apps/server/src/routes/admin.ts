import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import {
  adminUserListQuerySchema,
  adminUserUpdateInputSchema,
  mineListQuerySchema,
  pasteIdParamsSchema,
} from '@psh/shared'
import { Hono } from 'hono'
import * as admin from '../controllers/admin-controller'
import { getUser, requireAdmin } from '../middleware/auth'

export const adminRoutes = new Hono<UserEnv>()
  .use('*', requireAdmin())
  .get(
    '/users',
    zValidator('query', adminUserListQuerySchema),
    c => admin.listUsers(c, c.req.valid('query')),
  )
  .patch(
    '/users/:id',
    zValidator('json', adminUserUpdateInputSchema),
    c => admin.updateUser(c, getUser(c).id, c.req.param('id'), c.req.valid('json')),
  )
  .delete(
    '/users/:id',
    c => admin.deleteUser(c, getUser(c).id, c.req.param('id')),
  )
  .get(
    '/pastes',
    zValidator('query', mineListQuerySchema),
    c => admin.listPastes(c, c.req.valid('query')),
  )
  .delete(
    '/pastes/id/:id',
    zValidator('param', pasteIdParamsSchema),
    c => admin.deletePaste(c, c.req.valid('param').id),
  )

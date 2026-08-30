import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { mineListQuerySchema, pasteIdParamsSchema, pasteViewsQuerySchema } from '@psh/shared'
import { Hono } from 'hono'
import * as mine from '../controllers/mine-controller'
import { getUser, requireUser } from '../middleware/auth'

export const mineRoutes = new Hono<UserEnv>()
  .use('*', requireUser())
  .get(
    '/',
    zValidator('query', mineListQuerySchema),
    (c) => {
      return mine.listMine(c, getUser(c).id, c.req.valid('query'))
    },
  )
  .get(
    '/favorites',
    zValidator('query', mineListQuerySchema),
    (c) => {
      return mine.listFavorites(c, getUser(c).id, c.req.valid('query'))
    },
  )
  .get(
    '/:id/stats',
    zValidator('param', pasteIdParamsSchema),
    (c) => {
      return mine.stats(c, getUser(c).id, c.req.valid('param').id)
    },
  )
  .get(
    '/:id/views',
    zValidator('param', pasteIdParamsSchema),
    zValidator('query', pasteViewsQuerySchema),
    (c) => {
      return mine.views(c, getUser(c).id, c.req.valid('param').id, c.req.valid('query'))
    },
  )

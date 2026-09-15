import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { pasteIdParamsSchema, pasteViewsQuerySchema } from '@psh/shared'
import { Hono } from 'hono'
import { stats, views } from '../controllers/stats-controller'
import { getUser, requireUser } from '../middleware/auth'

export const statsRoutes = new Hono<UserEnv>()
  .use('*', requireUser())
  .get(
    '/:id',
    zValidator('param', pasteIdParamsSchema),
    c => stats(c, getUser(c), c.req.valid('param').id),
  )
  .get(
    '/:id/views',
    zValidator('param', pasteIdParamsSchema),
    zValidator('query', pasteViewsQuerySchema),
    c => views(c, getUser(c), c.req.valid('param').id, c.req.valid('query')),
  )

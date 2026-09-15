import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { pasteIdParamsSchema } from '@psh/shared'
import { Hono } from 'hono'
import { stats } from '../controllers/mine-controller'
import { getUser, requireUser } from '../middleware/auth'

export const statsRoutes = new Hono<UserEnv>()
  .use('*', requireUser())
  .get(
    '/:id',
    zValidator('param', pasteIdParamsSchema),
    c => stats(c, getUser(c), c.req.valid('param').id),
  )

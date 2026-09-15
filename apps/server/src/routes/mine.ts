import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { mineListQuerySchema } from '@psh/shared'
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

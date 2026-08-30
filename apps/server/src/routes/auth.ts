import type { UserEnv } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { authInputSchema, changePasswordInputSchema } from '@psh/shared'
import { Hono } from 'hono'
import * as auth from '../controllers/auth-controller'
import { requireUser } from '../middleware/auth'

export const authRoutes = new Hono()
  .post(
    '/register',
    zValidator('json', authInputSchema),
    c => auth.register(c, c.req.valid('json')),
  )
  .post(
    '/login',
    zValidator('json', authInputSchema),
    c => auth.login(c, c.req.valid('json')),
  )
  .post('/logout', c => auth.logout(c))
  .get('/me', c => auth.me(c))

export const authUserRoutes = new Hono<UserEnv>()
  .use('*', requireUser())
  .post(
    '/password',
    zValidator('json', changePasswordInputSchema),
    c => auth.changeUserPassword(c, c.req.valid('json')),
  )

import { zValidator } from '@hono/zod-validator'
import { authInputSchema } from '@psh/shared'
import { Hono } from 'hono'
import * as auth from '../controllers/auth-controller'

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

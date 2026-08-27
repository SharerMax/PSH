import type { User } from '@psh/shared'
import { zValidator } from '@hono/zod-validator'
import { authInputSchema } from '@psh/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { db } from '../db'
import { users } from '../db/schema'
import { createSession, destroySession, getSessionUser, sessionCookieOptions } from '../lib/auth'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { newUserId } from '../lib/id'

function toUser(user: { id: string, username: string }): User {
  return { id: user.id, username: user.username }
}

export const authRoutes = new Hono()
  .post(
    '/register',
    zValidator('json', authInputSchema),
    (c) => {
      const { username, password } = c.req.valid('json')
      const [existing] = db.select().from(users).where(eq(users.username, username)).all()
      if (existing) {
        return c.json({ error: 'Username already taken' }, 409)
      }
      const id = newUserId()
      db.insert(users).values({ id, username, passwordHash: hashPassword(password) }).run()
      setCookie(c, 'psh_session', createSession(id), sessionCookieOptions)
      return c.json(toUser({ id, username }), 201)
    },
  )
  .post(
    '/login',
    zValidator('json', authInputSchema),
    (c) => {
      const { username, password } = c.req.valid('json')
      const [user] = db.select().from(users).where(eq(users.username, username)).all()
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return c.json({ error: 'Invalid username or password' }, 401)
      }
      setCookie(c, 'psh_session', createSession(user.id), sessionCookieOptions)
      return c.json(toUser(user))
    },
  )
  .post('/logout', (c) => {
    destroySession(c)
    return c.json({ ok: true })
  })
  .get('/me', (c) => {
    const user = getSessionUser(c)
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401)
    }
    return c.json(toUser(user))
  })

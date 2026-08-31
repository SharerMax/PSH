import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from './lib/logger'
import { requestLogger } from './middleware/logger'
import { adminRoutes } from './routes/admin'
import { authRoutes, authUserRoutes } from './routes/auth'
import { mineRoutes } from './routes/mine'
import { apiRoutes, rawRoutes } from './routes/pastes'

function toPosix(p: string): string {
  return p.replaceAll(sep, '/')
}

export function createApp(): Hono {
  const app = new Hono()

  app.use('*', requestLogger())
  app.route('/api/pastes', apiRoutes)
  app.route('/api/auth', authRoutes)
  app.route('/api/auth', authUserRoutes)
  app.route('/api/mine', mineRoutes)
  app.route('/api/admin', adminRoutes)
  app.route('/raw', rawRoutes)

  // single-process deployment: host the built web client when present.
  // Anchored to cwd (apps/server in dev/start/docker) — import.meta.dirname
  // differs between tsx (src/) and the esbuild bundle (dist/src/)
  const webDistDir = resolve(process.cwd(), '../web/dist')

  if (existsSync(webDistDir)) {
    const root = toPosix(relative(process.cwd(), webDistDir)) || '.'
    const indexHtml = readFileSync(join(webDistDir, 'index.html'), 'utf8')

    app.use('*', serveStatic({ root }))
    app.get('*', (c) => {
      if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/raw/')) {
        return c.json({ error: 'Not found' }, 404)
      }
      return c.html(indexHtml)
    })
  }
  else {
    app.notFound(c => c.text('Not found', 404))
  }

  app.onError((error, c) => {
    logger.error({ err: error, method: c.req.method, path: c.req.path }, 'unhandled error')
    if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/raw/')) {
      return c.json({ error: 'Internal server error' }, 500)
    }
    return c.text('Internal server error', 500)
  })

  return app
}

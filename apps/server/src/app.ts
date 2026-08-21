import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { apiRoutes, rawRoutes } from './routes/pastes'

function toPosix(p: string): string {
  return p.replaceAll(sep, '/')
}

export function createApp(): Hono {
  const app = new Hono()

  app.route('/api/pastes', apiRoutes)
  app.route('/raw', rawRoutes)

  // single-process deployment: host the built web client when present
  const webDistDir = resolve(import.meta.dirname, '../../web/dist')

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
    console.error('[server] unhandled error:', error)
    if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/raw/')) {
      return c.json({ error: 'Internal server error' }, 500)
    }
    return c.text('Internal server error', 500)
  })

  return app
}

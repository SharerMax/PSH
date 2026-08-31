import type { MiddlewareHandler } from 'hono'
import { logger } from '../lib/logger'

const LOGGED_PREFIXES = ['/api/', '/raw/']

/** Request logging for API/raw routes only — static SPA requests stay silent. */
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now()
    await next()
    if (!LOGGED_PREFIXES.some(prefix => c.req.path.startsWith(prefix))) {
      return
    }
    const durationMs = Math.round(performance.now() - start)
    const level = c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info'
    logger[level](
      { method: c.req.method, path: c.req.path, status: c.res.status, durationMs },
      'request',
    )
  }
}

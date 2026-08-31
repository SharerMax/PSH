import { serve } from '@hono/node-server'
import { createApp } from './app'
import { sqlite } from './db'
import { runMigrations } from './db/migrate'
import { env } from './env'
import { purgeExpired, startCleanupInterval } from './lib/cleanup'
import { logger } from './lib/logger'

runMigrations()
purgeExpired()
startCleanupInterval()

const app = createApp()

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`server listening on http://localhost:${info.port}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      sqlite.close()
      logger.info('server stopped')
      process.exit(0)
    })
  })
}

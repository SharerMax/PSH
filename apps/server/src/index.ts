import { serve } from '@hono/node-server'
import { createApp } from './app'
import { sqlite } from './db'
import { runMigrations } from './db/migrate'
import { env } from './env'
import { purgeExpired, startCleanupInterval } from './lib/cleanup'

runMigrations()
purgeExpired()
startCleanupInterval()

const app = createApp()

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[psh] server listening on http://localhost:${info.port}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      sqlite.close()
      process.exit(0)
    })
  })
}

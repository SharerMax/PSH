import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './index'

export function runMigrations(): void {
  // cwd-anchored (apps/server in dev/start/docker); import.meta.dirname
  // differs between tsx (src/db) and the esbuild bundle (dist/src)
  const migrationsFolder = resolve(process.cwd(), 'drizzle')
  migrate(db, { migrationsFolder })
}

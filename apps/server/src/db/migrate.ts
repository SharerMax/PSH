import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './index'

export function runMigrations(): void {
  const migrationsFolder = resolve(import.meta.dirname, '../../drizzle')
  migrate(db, { migrationsFolder })
}

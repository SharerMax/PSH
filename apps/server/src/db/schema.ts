import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const pastes = sqliteTable('pastes', {
  id: text('id').primaryKey(),
  title: text('title'),
  language: text('language').notNull().default('plaintext'),
  content: text('content'),
  contentEnc: text('content_enc'),
  iv: text('iv'),
  salt: text('salt'),
  tag: text('tag'),
  passwordHash: text('password_hash'),
  burnAfterRead: integer('burn_after_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
})

export type PasteRow = typeof pastes.$inferSelect
export type NewPasteRow = typeof pastes.$inferInsert

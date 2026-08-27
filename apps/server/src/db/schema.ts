import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert

export const sessions = sqliteTable(
  'sessions',
  {
    token: text('token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  table => [
    index('sessions_user_id_idx').on(table.userId),
  ],
)

export type SessionRow = typeof sessions.$inferSelect
export type NewSessionRow = typeof sessions.$inferInsert

export const pastes = sqliteTable(
  'pastes',
  {
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
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  },
  table => [
    index('pastes_user_id_idx').on(table.userId),
  ],
)

export type PasteRow = typeof pastes.$inferSelect
export type NewPasteRow = typeof pastes.$inferInsert

export const pasteViews = sqliteTable(
  'paste_views',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pasteId: text('paste_id')
      .notNull()
      .references(() => pastes.id, { onDelete: 'cascade' }),
    viewedAt: integer('viewed_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    country: text('country').notNull().default('unknown'),
    ip: text('ip'),
  },
  table => [
    index('paste_views_paste_id_idx').on(table.pasteId),
  ],
)

export type PasteViewRow = typeof pasteViews.$inferSelect
export type NewPasteViewRow = typeof pasteViews.$inferInsert

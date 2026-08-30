import { z } from 'zod'

export const EXPIRY_OPTIONS = ['10min', '1h', '1d', '7d', 'forever'] as const
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number]

export const MAX_CONTENT_BYTES = 1024 * 1024

export const PASTE_LANGUAGES = [
  'plaintext',
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'json',
  'html',
  'css',
  'python',
  'go',
  'rust',
  'java',
  'c',
  'cpp',
  'csharp',
  'sql',
  'bash',
  'yaml',
  'markdown',
] as const
export type PasteLanguage = (typeof PASTE_LANGUAGES)[number]

export const LINK_MIN = 4
export const LINK_MAX = 32

export const linkSchema = z
  .string()
  .trim()
  .min(LINK_MIN, `link must be at least ${LINK_MIN} characters`)
  .max(LINK_MAX)
  .regex(/^[\w.-]+$/, 'link may only contain letters, digits, dots, dashes and underscores')

export const pasteCreateInputSchema = z.object({
  title: z.string().trim().max(200).optional(),
  language: z.string().trim().max(64).default('plaintext').catch('plaintext'),
  content: z.string().min(1, 'content is required').max(MAX_CONTENT_BYTES),
  expiresIn: z.enum(EXPIRY_OPTIONS).optional(),
  password: z.string().min(1).max(256).optional(),
  burnAfterRead: z.boolean().optional(),
  link: linkSchema.optional(),
})
export type PasteCreateInput = z.infer<typeof pasteCreateInputSchema>

export const pasteMetaSchema = z.object({
  link: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  hasPassword: z.boolean(),
  burnAfterRead: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})
export type PasteMeta = z.infer<typeof pasteMetaSchema>

export const pasteContentSchema = z.object({
  link: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  content: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})
export type PasteContent = z.infer<typeof pasteContentSchema>

/** Public link-based route param (4-32 chars). */
export const pasteLinkParamsSchema = z.object({
  link: linkSchema,
})
export type PasteLinkParams = z.infer<typeof pasteLinkParamsSchema>

/** Integer paste id for owner-only routes (URL params arrive as strings). */
export const pasteIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
export type PasteIdParams = z.infer<typeof pasteIdParamsSchema>

export const pasteCreatedResponseSchema = z.object({
  link: z.string(),
})
export type PasteCreatedResponse = z.infer<typeof pasteCreatedResponseSchema>

export const favoriteStatusSchema = z.object({
  favorited: z.boolean(),
})
export type FavoriteStatus = z.infer<typeof favoriteStatusSchema>

export const favoriteItemSchema = z.object({
  id: z.number().int().nonnegative(),
  link: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  hasPassword: z.boolean(),
  burnAfterRead: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  favoritedAt: z.string(),
})
export type FavoriteItem = z.infer<typeof favoriteItemSchema>

export const favoriteListSchema = z.array(favoriteItemSchema)
export type FavoriteList = z.infer<typeof favoriteListSchema>

export const pasteUpdateInputSchema = z.object({
  title: z.string().trim().max(200).optional(),
  language: z.string().trim().max(64).optional(),
  content: z.string().min(1, 'content is required').max(MAX_CONTENT_BYTES).optional(),
  password: z.string().min(1).max(256).optional(),
})
export type PasteUpdateInput = z.infer<typeof pasteUpdateInputSchema>

export const USERNAME_MIN = 3
export const USERNAME_MAX = 32
export const USER_PASSWORD_MIN = 8

export const authInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN, `username must be at least ${USERNAME_MIN} characters`)
    .max(USERNAME_MAX)
    .regex(/^[\w.-]+$/, 'username may only contain letters, digits, dots, dashes and underscores'),
  password: z
    .string()
    .min(USER_PASSWORD_MIN, `password must be at least ${USER_PASSWORD_MIN} characters`)
    .max(128),
})
export type AuthInput = z.infer<typeof authInputSchema>

export const USER_ROLES = ['admin', 'user'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(USER_ROLES),
})
export type User = z.infer<typeof userSchema>

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z
    .string()
    .min(USER_PASSWORD_MIN, `password must be at least ${USER_PASSWORD_MIN} characters`)
    .max(128),
})
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>

export const myPasteItemSchema = z.object({
  id: z.number().int().nonnegative(),
  link: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  hasPassword: z.boolean(),
  burnAfterRead: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  views: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable(),
})
export type MyPasteItem = z.infer<typeof myPasteItemSchema>

export const myPasteListSchema = z.array(myPasteItemSchema)
export type MyPasteList = z.infer<typeof myPasteListSchema>

export const pasteStatsSchema = z.object({
  id: z.number().int().nonnegative(),
  link: z.string(),
  totalViews: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable(),
  geoEnabled: z.boolean(),
  byCountry: z.array(z.object({
    country: z.string(),
    count: z.number().int().nonnegative(),
  })),
  recent: z.array(z.object({
    viewedAt: z.string(),
    ip: z.string().nullable(),
    country: z.string(),
  })),
})
export type PasteStats = z.infer<typeof pasteStatsSchema>

const isoDatetime = z.string().refine(value => !Number.isNaN(Date.parse(value)), 'invalid datetime')

/** Shared page query for /api/mine and /api/mine/favorites. */
export const mineListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** Substring match against paste title or link. */
  q: z.string().trim().max(200).optional(),
  language: z.string().trim().min(1).max(64).optional(),
  /** Filter on paste creation time. */
  from: isoDatetime.optional(),
  to: isoDatetime.optional(),
})
export type MineListQuery = z.infer<typeof mineListQuerySchema>

const pageMeta = {
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
}

export const myPasteListPageSchema = z.object({
  ...pageMeta,
  rows: z.array(myPasteItemSchema),
})
export type MyPasteListPage = z.infer<typeof myPasteListPageSchema>

export const favoriteListPageSchema = z.object({
  ...pageMeta,
  rows: z.array(favoriteItemSchema),
})
export type FavoriteListPage = z.infer<typeof favoriteListPageSchema>

export const pasteViewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  country: z.string().min(1).max(16).optional(),
  ip: z.string().max(64).optional(),
  from: isoDatetime.optional(),
  to: isoDatetime.optional(),
})
export type PasteViewsQuery = z.infer<typeof pasteViewsQuerySchema>

export const pasteViewsPageSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  rows: z.array(z.object({
    viewedAt: z.string(),
    ip: z.string().nullable(),
    country: z.string(),
  })),
})
export type PasteViewsPage = z.infer<typeof pasteViewsPageSchema>

/** Admin: paginated user list with a username search. */
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
})
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>

export const adminUserItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(USER_ROLES),
  banned: z.boolean(),
  createdAt: z.string(),
  pasteCount: z.number().int().nonnegative(),
})
export type AdminUserItem = z.infer<typeof adminUserItemSchema>

export const adminUserListPageSchema = z.object({
  ...pageMeta,
  rows: z.array(adminUserItemSchema),
})
export type AdminUserListPage = z.infer<typeof adminUserListPageSchema>

export const adminUserUpdateInputSchema = z.object({
  banned: z.boolean().optional(),
  password: z
    .string()
    .min(USER_PASSWORD_MIN, `password must be at least ${USER_PASSWORD_MIN} characters`)
    .max(128)
    .optional(),
})
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateInputSchema>

/** Admin: all live pastes with the author username (null for anonymous pastes). */
export const adminPasteItemSchema = myPasteItemSchema.extend({
  username: z.string().nullable(),
})
export type AdminPasteItem = z.infer<typeof adminPasteItemSchema>

export const adminPasteListPageSchema = z.object({
  ...pageMeta,
  rows: z.array(adminPasteItemSchema),
})
export type AdminPasteListPage = z.infer<typeof adminPasteListPageSchema>

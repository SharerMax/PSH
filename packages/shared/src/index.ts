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

export const CUSTOM_ID_MIN = 4
export const CUSTOM_ID_MAX = 32

export const customIdSchema = z
  .string()
  .trim()
  .min(CUSTOM_ID_MIN, `custom link must be at least ${CUSTOM_ID_MIN} characters`)
  .max(CUSTOM_ID_MAX)
  .regex(/^[\w.-]+$/, 'custom link may only contain letters, digits, dots, dashes and underscores')

export const pasteCreateInputSchema = z.object({
  title: z.string().trim().max(200).optional(),
  language: z.string().trim().max(64).default('plaintext').catch('plaintext'),
  content: z.string().min(1, 'content is required').max(MAX_CONTENT_BYTES),
  expiresIn: z.enum(EXPIRY_OPTIONS).optional(),
  password: z.string().min(1).max(256).optional(),
  burnAfterRead: z.boolean().optional(),
  customId: customIdSchema.optional(),
})
export type PasteCreateInput = z.infer<typeof pasteCreateInputSchema>

export const pasteMetaSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  hasPassword: z.boolean(),
  burnAfterRead: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})
export type PasteMeta = z.infer<typeof pasteMetaSchema>

export const pasteContentSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  language: z.string(),
  content: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
})
export type PasteContent = z.infer<typeof pasteContentSchema>

export const pasteIdParamsSchema = z.object({
  id: z.string().regex(/^[\w.-]{4,32}$/, 'invalid paste id'),
})
export type PasteIdParams = z.infer<typeof pasteIdParamsSchema>

export const pasteCreatedResponseSchema = z.object({
  id: z.string(),
})
export type PasteCreatedResponse = z.infer<typeof pasteCreatedResponseSchema>

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

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
})
export type User = z.infer<typeof userSchema>

export const myPasteItemSchema = z.object({
  id: z.string(),
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
  id: z.string(),
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

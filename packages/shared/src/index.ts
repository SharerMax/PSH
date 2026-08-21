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

export const pasteCreateInputSchema = z.object({
  title: z.string().trim().max(200).optional(),
  language: z.string().trim().max(64).default('plaintext').catch('plaintext'),
  content: z.string().min(1, 'content is required').max(MAX_CONTENT_BYTES),
  expiresIn: z.enum(EXPIRY_OPTIONS).optional(),
  password: z.string().min(1).max(256).optional(),
  burnAfterRead: z.boolean().optional(),
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
  id: z.string().regex(/^[A-Za-z0-9_-]{8}$/, 'invalid paste id'),
})
export type PasteIdParams = z.infer<typeof pasteIdParamsSchema>

export const pasteCreatedResponseSchema = z.object({
  id: z.string(),
})
export type PasteCreatedResponse = z.infer<typeof pasteCreatedResponseSchema>

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_PATH: z.string().min(1).default('data/psh.db'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  // MaxMind .mmdb file for IP -> country lookup; when unset, countries are not tracked
  MMDB_PATH: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // console on purpose: the logger depends on this module
  console.error('Invalid environment variables:', z.treeifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data

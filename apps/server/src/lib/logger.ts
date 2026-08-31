import { pino } from 'pino'
import { env } from '../env'

/** Shared structured logger; output is JSON on stdout (docker-friendly). */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
})

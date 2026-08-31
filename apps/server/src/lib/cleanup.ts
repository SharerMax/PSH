import { deleteExpiredPastes } from '../repositories/paste-repository'
import { deleteExpiredSessions } from '../repositories/session-repository'
import { logger } from './logger'

export function purgeExpired(): number {
  const result = deleteExpiredPastes()
  deleteExpiredSessions()
  return result
}

export function startCleanupInterval(intervalMs = 10 * 60 * 1000): NodeJS.Timeout {
  const timer = setInterval(() => {
    try {
      const removed = purgeExpired()
      if (removed > 0) {
        logger.info({ removed }, 'expired pastes purged')
      }
    }
    catch (error) {
      logger.error({ err: error }, 'failed to purge expired pastes')
    }
  }, intervalMs)
  timer.unref()
  return timer
}

import { and, isNotNull, lt } from 'drizzle-orm'
import { db } from '../db'
import { pastes } from '../db/schema'
import { purgeExpiredSessions } from './auth'

export function purgeExpired(): number {
  const result = db
    .delete(pastes)
    .where(and(isNotNull(pastes.expiresAt), lt(pastes.expiresAt, new Date())))
    .run()
  purgeExpiredSessions()
  return result.changes
}

export function startCleanupInterval(intervalMs = 10 * 60 * 1000): NodeJS.Timeout {
  const timer = setInterval(() => {
    try {
      const removed = purgeExpired()
      if (removed > 0) {
        console.log(`[cleanup] removed ${removed} expired paste(s)`)
      }
    }
    catch (error) {
      console.error('[cleanup] failed to purge expired pastes:', error)
    }
  }, intervalMs)
  timer.unref()
  return timer
}

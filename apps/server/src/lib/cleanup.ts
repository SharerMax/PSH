import { deleteExpiredPastes } from '../repositories/paste-repository'
import { deleteExpiredSessions } from '../repositories/session-repository'

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

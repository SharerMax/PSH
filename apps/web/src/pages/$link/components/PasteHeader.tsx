import type { PasteMeta } from '@psh/shared'
import { FlameKindlingIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDuration, useI18n } from '@/lib/i18n'

interface PasteHeaderProps {
  meta: PasteMeta
  now: number
  /** True once the paste has been read (burn-after-read). */
  burned: boolean
}

export function PasteHeader({ meta, now, burned }: PasteHeaderProps) {
  const { t, locale } = useI18n()

  const expiresAtTime = meta.expiresAt ? new Date(meta.expiresAt).getTime() : null
  const expired = expiresAtTime !== null && expiresAtTime <= now

  return (
    <>
      <h1 className="truncate text-3xl font-bold tracking-tight">
        {meta.title ?? t('view.untitled')}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{meta.language}</Badge>
        {meta.hasPassword && (
          <Badge variant="outline">{t('badge.passwordProtected')}</Badge>
        )}
        {burned && (
          <Badge variant="destructive">
            <FlameKindlingIcon className="size-3" />
            {t('badge.destroyedAfterRead')}
          </Badge>
        )}
        {expiresAtTime === null && !burned && (
          <Badge variant="secondary">{t('badge.neverExpires')}</Badge>
        )}
        {expiresAtTime !== null && !expired && !burned && (
          <Badge variant="secondary">
            {t('badge.expiresIn', { time: formatDuration(expiresAtTime - now, locale) })}
          </Badge>
        )}
        {expired && !burned && <Badge variant="destructive">{t('badge.expired')}</Badge>}
      </div>
    </>
  )
}

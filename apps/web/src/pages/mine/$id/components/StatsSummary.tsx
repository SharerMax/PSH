import type { PasteStats } from '@psh/shared'
import { GlobeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'

function formatDateTime(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StatsSummaryProps {
  stats: PasteStats
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const { t, locale } = useI18n()
  const last = stats.recent[0]

  if (stats.totalViews === 0) {
    return <p className="text-muted-foreground text-sm">{t('stats.noData')}</p>
  }

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span>
        {t('stats.totalViews')}
        {' '}
        <span className="text-foreground font-medium">{stats.totalViews}</span>
      </span>
      {stats.lastViewedAt && (
        <span>
          {t('stats.lastViewed')}
          {' '}
          {formatDateTime(stats.lastViewedAt, locale)}
        </span>
      )}
      {last && (
        <span className="inline-flex items-center gap-1">
          {t('stats.lastIp')}
          {' '}
          <span className="text-foreground font-mono text-xs">
            {last.ip ?? '—'}
          </span>
          {stats.geoEnabled && (
            <Badge variant="secondary" className="px-1.5 py-0">
              <GlobeIcon className="size-3" />
              {last.country}
            </Badge>
          )}
        </span>
      )}
    </div>
  )
}

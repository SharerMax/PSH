import type { PasteStats } from '@psh/shared'
import { GlobeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

interface SummaryCardsProps {
  stats: PasteStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const { t, locale } = useI18n()
  const last = stats.recent[0]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>{t('stats.totalViews')}</CardDescription>
          <CardTitle className="text-3xl">{stats.totalViews}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t('stats.lastViewed')}</CardDescription>
          <CardTitle className="text-base font-medium">
            {stats.lastViewedAt ? formatDateTime(stats.lastViewedAt, locale) : '—'}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{t('stats.lastIp')}</CardDescription>
          <CardTitle className="flex items-center gap-1.5 font-mono text-base font-medium">
            {last ? (last.ip ?? '—') : '—'}
            {last && stats.geoEnabled && (
              <Badge variant="secondary" className="font-sans">
                <GlobeIcon className="size-3" />
                {last.country}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

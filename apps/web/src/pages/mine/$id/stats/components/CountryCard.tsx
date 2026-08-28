import { GlobeIcon } from 'lucide-react'
import { CountryMap } from '@/components/CountryMap'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'

interface CountryCardProps {
  byCountry: Array<{ country: string, count: number }>
}

export function CountryCard({ byCountry }: CountryCardProps) {
  const { t } = useI18n()

  const counts = Object.fromEntries(byCountry.map(({ country, count }) => [country, count]))
  const top5 = byCountry.slice(0, 5)
  const otherCount = byCountry.slice(5).reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('stats.byCountry')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CountryMap counts={counts} />
        <p className="text-muted-foreground text-right text-xs">
          {t('stats.mapCredit')}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-foreground font-medium">{t('stats.top5')}</span>
          {top5.length === 0 && <span>{t('stats.noData')}</span>}
          {top5.map(({ country: code, count }) => (
            <Badge key={code} variant="secondary">
              <GlobeIcon className="size-3" />
              {code}
              {' · '}
              {count}
            </Badge>
          ))}
          {otherCount > 0 && (
            <Badge variant="outline">
              {t('stats.other')}
              {' · '}
              {otherCount}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

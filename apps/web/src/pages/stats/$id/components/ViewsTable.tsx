import type { PasteViewsPage } from '@psh/shared'
import { ChevronLeftIcon, ChevronRightIcon, GlobeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface ViewsTableProps {
  views: PasteViewsPage
  showCountry: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ViewsTable({ views, showCountry, page, totalPages, onPageChange }: ViewsTableProps) {
  const { t, locale } = useI18n()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('stats.colTime')}</TableHead>
            <TableHead>{t('stats.colIp')}</TableHead>
            <TableHead>{t('stats.colCountry')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {views.rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                {t('stats.noData')}
              </TableCell>
            </TableRow>
          )}
          {views.rows.map((view, index) => (
            <TableRow key={`${view.viewedAt}-${index}`}>
              <TableCell>{formatDateTime(view.viewedAt, locale)}</TableCell>
              <TableCell className="font-mono text-xs">{view.ip ?? '—'}</TableCell>
              <TableCell>
                {showCountry && (
                  <span className="inline-flex items-center gap-1">
                    <GlobeIcon className="text-muted-foreground size-3" />
                    {view.country}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-sm">
          {t('stats.totalViews')}
          {' '}
          {views.total}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={page <= 1}
          aria-label={t('stats.prevPage')}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="text-sm">
          {page}
          {' / '}
          {totalPages}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={page >= totalPages}
          aria-label={t('stats.nextPage')}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </>
  )
}

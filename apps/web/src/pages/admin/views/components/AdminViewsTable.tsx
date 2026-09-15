import type { AdminViewsPage } from '@psh/shared'
import { GlobeIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

type Row = AdminViewsPage['rows'][number]

function formatDateTime(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminViewsTable({ rows, showCountry }: { rows: Row[], showCountry: boolean }) {
  const { t, locale } = useI18n()
  const colSpan = showCountry ? 5 : 4

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('stats.colTime')}</TableHead>
              <TableHead>{t('admin.stats.colPaste')}</TableHead>
              <TableHead>{t('admin.pastes.col.author')}</TableHead>
              <TableHead>{t('stats.colIp')}</TableHead>
              {showCountry && <TableHead>{t('stats.colCountry')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-muted-foreground">
                  {t('stats.noData')}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, index) => (
              <TableRow key={`${row.pasteId}-${row.viewedAt}-${index}`}>
                <TableCell className="whitespace-nowrap">{formatDateTime(row.viewedAt, locale)}</TableCell>
                <TableCell className="max-w-48 truncate">
                  <Link to={`/stats/${row.pasteId}`} className="hover:underline">
                    {row.title ?? t('view.untitled')}
                  </Link>
                  <span className="text-muted-foreground ml-2 font-mono text-xs">{row.link}</span>
                </TableCell>
                <TableCell>{row.username ?? t('admin.pastes.anonymous')}</TableCell>
                <TableCell className="font-mono text-xs">{row.ip ?? '—'}</TableCell>
                {showCountry && (
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <GlobeIcon className="text-muted-foreground size-3" />
                      {row.country}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

import type { AdminStats } from '@psh/shared'
import { Link } from 'react-router'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

type TopRow = AdminStats['topPastes'][number]

export function TopPastesTable({ rows }: { rows: TopRow[] }) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.stats.top10')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t('admin.stats.colPaste')}</TableHead>
              <TableHead>{t('admin.pastes.col.author')}</TableHead>
              <TableHead className="text-right">{t('admin.stats.colViews')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  {t('stats.noData')}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="max-w-72 truncate">
                  <Link to={`/stats/${row.id}`} className="hover:underline">
                    {row.title ?? t('view.untitled')}
                  </Link>
                  <span className="text-muted-foreground ml-2 font-mono text-xs">{row.link}</span>
                </TableCell>
                <TableCell>{row.username ?? t('admin.pastes.anonymous')}</TableCell>
                <TableCell className="text-right font-mono">{row.views}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

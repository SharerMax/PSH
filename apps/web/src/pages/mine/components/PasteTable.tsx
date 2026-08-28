import type { MyPasteItem } from '@psh/shared'
import { FlameKindlingIcon, KeyRoundIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
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

function formatDate(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PasteTableProps {
  items: MyPasteItem[]
  now: number
  onDelete: (item: MyPasteItem) => void
}

export function PasteTable({ items, now, onDelete }: PasteTableProps) {
  const { t } = useI18n()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('mine.col.title')}</TableHead>
          <TableHead>{t('mine.col.link')}</TableHead>
          <TableHead>{t('mine.col.created')}</TableHead>
          <TableHead>{t('mine.col.expires')}</TableHead>
          <TableHead>{t('mine.col.views')}</TableHead>
          <TableHead className="text-right">{t('mine.col.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <Row key={item.id} item={item} now={now} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({
  item,
  now,
  onDelete,
}: { item: MyPasteItem, now: number, onDelete: PasteTableProps['onDelete'] }) {
  const { t, locale } = useI18n()

  const expiresAtTime = item.expiresAt ? new Date(item.expiresAt).getTime() : null
  const expired = expiresAtTime !== null && expiresAtTime <= now

  return (
    <TableRow>
      <TableCell className="max-w-56">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link to={`/${item.link}`} className="font-medium hover:underline">
            {item.title ?? t('view.untitled')}
          </Link>
          <Badge variant="secondary">{item.language}</Badge>
          {item.hasPassword && (
            <Badge variant="outline" aria-label={t('badge.passwordProtected')}>
              <KeyRoundIcon className="size-3" />
            </Badge>
          )}
          {item.burnAfterRead && (
            <Badge variant="outline" aria-label={t('field.burnAfterRead')}>
              <FlameKindlingIcon className="size-3" />
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">{item.link}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(item.createdAt, locale)}</TableCell>
      <TableCell className="text-muted-foreground">
        {expiresAtTime === null
          ? t('badge.neverExpires')
          : expired
            ? <Badge variant="destructive">{t('badge.expired')}</Badge>
            : formatDate(item.expiresAt!, locale)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.views > 0
          ? (
              <span title={item.lastViewedAt ? formatDate(item.lastViewedAt, locale) : undefined}>
                {t('mine.views', { count: item.views })}
              </span>
            )
          : t('mine.neverViewed')}
      </TableCell>
      <TableCell className="text-right">
        <div className="inline-flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link to={`/mine/${item.id}`} />}
          >
            {t('mine.manage')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            aria-label={t('action.delete')}
            onClick={() => onDelete(item)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

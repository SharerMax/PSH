import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Shared pagination bar for the "my pastes" / "my favorites" lists. */
export function ListPagination({
  total,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const { t } = useI18n()

  // value -> label mapping so the trigger renders labels instead of raw values
  const items = PAGE_SIZE_OPTIONS.map(size => ({
    value: String(size),
    label: t('mine.perPageCount', { count: size }),
  }))

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-muted-foreground text-sm">{t('mine.items', { count: total })}</span>
      <Select
        items={items}
        value={String(pageSize)}
        onValueChange={value => onPageSizeChange(Number(value ?? 20))}
      >
        <SelectTrigger size="sm" className="w-28" aria-label={t('mine.perPage')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(item => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  )
}

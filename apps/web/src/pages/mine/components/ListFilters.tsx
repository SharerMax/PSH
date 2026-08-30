import type { DateRange } from 'react-day-picker'
import { PASTE_LANGUAGES } from '@psh/shared'
import { enUS, zhCN } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'

function toISOStringDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Shared filter bar for the "my pastes" / "my favorites" lists. */
export function ListFilters({
  qInput,
  onQInputChange,
  language,
  onLanguageChange,
  rangeInput,
  onRangeChange,
  onApply,
  onReset,
}: {
  qInput: string
  onQInputChange: (value: string) => void
  language: string
  onLanguageChange: (value: string) => void
  rangeInput: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  onReset: () => void
}) {
  const { t, locale } = useI18n()

  // value -> label mapping so the trigger renders labels instead of raw values
  const languageItems = [
    { value: 'ALL', label: t('stats.all') },
    ...PASTE_LANGUAGES.map(lang => ({ value: lang, label: lang })),
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
      className="flex flex-wrap items-end gap-2"
      noValidate
    >
      <div className="flex w-44 flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">{t('mine.filterTitle')}</span>
        <Input
          value={qInput}
          onChange={e => onQInputChange(e.target.value)}
          className="h-8"
        />
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">{t('field.language')}</span>
        <Select items={languageItems} value={language} onValueChange={value => onLanguageChange(value ?? 'ALL')}>
          <SelectTrigger size="sm" className="w-full" aria-label={t('field.language')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageItems.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">{t('stats.dateRange')}</span>
        <Popover>
          <PopoverTrigger
            render={(
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-56 justify-start font-normal"
              />
            )}
          >
            <CalendarIcon className="size-3.5" />
            {rangeInput?.from
              ? `${toISOStringDate(rangeInput.from)} ~ ${rangeInput.to ? toISOStringDate(rangeInput.to) : '...'}`
              : t('stats.pickRange')}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              numberOfMonths={2}
              locale={locale === 'zh' ? zhCN : enUS}
              selected={rangeInput}
              onSelect={onRangeChange}
              defaultMonth={rangeInput?.from}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" size="sm" variant="outline" className="h-8">{t('stats.apply')}</Button>
      <Button type="button" size="sm" variant="ghost" className="h-8" onClick={onReset}>
        {t('stats.reset')}
      </Button>
    </form>
  )
}

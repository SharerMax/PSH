import type { DateRange } from 'react-day-picker'
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

interface FiltersBarProps {
  country: string
  onCountryChange: (value: string) => void
  ipInput: string
  onIpInputChange: (value: string) => void
  rangeInput: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  onReset: () => void
  /** Country codes available for the dropdown filter. */
  countries: string[]
}

export function FiltersBar({
  country,
  onCountryChange,
  ipInput,
  onIpInputChange,
  rangeInput,
  onRangeChange,
  onApply,
  onReset,
  countries,
}: FiltersBarProps) {
  const { t, locale } = useI18n()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
      className="flex flex-wrap items-end gap-2"
      noValidate
    >
      <div className="flex w-36 flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">{t('stats.filterCountry')}</span>
        <Select
          value={country}
          onValueChange={value => onCountryChange(value ?? 'ALL')}
        >
          <SelectTrigger size="sm" className="w-full" aria-label={t('stats.filterCountry')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('stats.all')}</SelectItem>
            {countries.map(code => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">{t('stats.filterIp')}</span>
        <Input
          value={ipInput}
          onChange={e => onIpInputChange(e.target.value)}
          placeholder="8.8.8"
          className="h-8"
        />
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

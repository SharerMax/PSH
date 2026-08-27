import type { PasteStats, PasteViewsPage } from '@psh/shared'
import type { DateRange } from 'react-day-picker'
import { enUS, zhCN } from 'date-fns/locale'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, GlobeIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { CountryMap } from '@/components/CountryMap'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError, getPasteStats, getPasteViews } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

const PAGE_SIZE = 10

function formatDateTime(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toISOStringDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface AppliedFilters {
  ip: string
  from: string
  to: string
}

export function PasteStatsPage() {
  const { id = '' } = useParams()
  const { t, locale } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [stats, setStats] = useState<PasteStats | null>(null)

  const [country, setCountry] = useState('ALL')
  const [ipInput, setIpInput] = useState('')
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>()
  const [applied, setApplied] = useState<AppliedFilters>({ ip: '', from: '', to: '' })
  const [page, setPage] = useState(1)
  const [views, setViews] = useState<PasteViewsPage | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const fetched = await getPasteStats(id)
        if (!cancelled) {
          setStats(fetched)
          setPhase('ready')
        }
      }
      catch (error) {
        if (cancelled)
          return
        setPhase('gone')
        if (!(error instanceof ApiError)) {
          console.error(error)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (phase !== 'ready') {
      return
    }
    let cancelled = false

    getPasteViews(id, {
      page,
      pageSize: PAGE_SIZE,
      country: country === 'ALL' ? undefined : country,
      ip: applied.ip || undefined,
      from: applied.from || undefined,
      to: applied.to || undefined,
    })
      .then((data) => {
        if (!cancelled) {
          setViews(data)
        }
      })
      .catch((error) => {
        if (!cancelled && !(error instanceof ApiError)) {
          console.error(error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, phase, page, country, applied])

  const copyText = useCallback(async (text: string, successMessage: string, failureMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    }
    catch {
      toast.error(failureMessage)
    }
  }, [])

  function handleCountryChange(value: string | null) {
    setCountry(value ?? 'ALL')
    setPage(1)
  }

  function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({
      ip: ipInput.trim(),
      from: rangeInput?.from ? `${toISOStringDate(rangeInput.from)}T00:00:00` : '',
      to: rangeInput?.to ? `${toISOStringDate(rangeInput.to)}T23:59:59` : '',
    })
    setPage(1)
  }

  function handleResetFilters() {
    setIpInput('')
    setRangeInput(undefined)
    setApplied({ ip: '', from: '', to: '' })
    setCountry('ALL')
    setPage(1)
  }

  if (authLoading || !user || phase === 'loading' || !stats) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    )
  }

  if (phase === 'gone') {
    return (
      <main className="bg-background flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('view.goneTitle')}</CardTitle>
            <CardDescription>{t('view.goneDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button nativeButton={false} render={<Link to="/mine" />}>
              {t('nav.myPastes')}
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const pasteUrl = `${window.location.origin}/${id}`
  const byCountry = stats.byCountry
  const counts = Object.fromEntries(byCountry.map(({ country, count }) => [country, count]))
  const top5 = byCountry.slice(0, 5)
  const otherCount = byCountry.slice(5).reduce((sum, item) => sum + item.count, 0)
  const last = stats.recent[0]
  const totalPages = views ? Math.max(1, Math.ceil(views.total / views.pageSize)) : 1

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader
            left={(
              <Link to={`/mine/${id}`} className="text-muted-foreground text-sm hover:underline">
                {t('manage.title')}
              </Link>
            )}
            beforeControls={<span className="font-mono text-xs">{id}</span>}
          />
          <h1 className="text-3xl font-bold tracking-tight">{t('stats.title')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{t('stats.link')}</span>
            <code className="bg-muted rounded px-2 py-0.5 text-sm">{pasteUrl}</code>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={t('action.copyLink')}
              onClick={() => copyText(pasteUrl, t('toast.copiedLink'), t('error.copyLink'))}
            >
              <CopyIcon />
            </Button>
          </div>
        </header>

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

        {stats.geoEnabled
          ? (
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
          : (
              <p className="text-muted-foreground text-sm">{t('stats.geoDisabled')}</p>
            )}

        <Card>
          <CardHeader>
            <CardTitle>{t('stats.records')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-2" noValidate>
              <div className="flex w-36 flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">{t('stats.filterCountry')}</span>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger size="sm" className="w-full" aria-label={t('stats.filterCountry')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t('stats.all')}</SelectItem>
                    {byCountry.map(({ country: code }) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-36 flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">{t('stats.filterIp')}</span>
                <Input
                  value={ipInput}
                  onChange={e => setIpInput(e.target.value)}
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
                      onSelect={setRangeInput}
                      defaultMonth={rangeInput?.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-8">{t('stats.apply')}</Button>
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={handleResetFilters}>
                {t('stats.reset')}
              </Button>
            </form>

            {!views
              ? (
                  <Skeleton className="h-48 w-full" />
                )
              : (
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
                              {stats.geoEnabled && (
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
                        onClick={() => setPage(p => Math.max(1, p - 1))}
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
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRightIcon />
                      </Button>
                    </div>
                  </>
                )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

import type { PasteStats, PasteViewsPage } from '@psh/shared'
import type { DateRange } from 'react-day-picker'
import { CopyIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getPasteStats, getPasteViews } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { CountryCard } from './components/CountryCard'
import { FiltersBar } from './components/FiltersBar'
import { SummaryCards } from './components/SummaryCards'
import { ViewsTable } from './components/ViewsTable'

const PAGE_SIZE = 10

interface AppliedFilters {
  ip: string
  from: string
  to: string
}

export function PasteStatsPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
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
        const fetched = await getPasteStats(Number(id))
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

    getPasteViews(Number(id), {
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

  const copyPasteUrl = useCallback(async (pasteUrl: string) => {
    try {
      await navigator.clipboard.writeText(pasteUrl)
      toast.success(t('toast.copiedLink'))
    }
    catch {
      toast.error(t('error.copyLink'))
    }
  }, [t])

  function handleApplyFilters() {
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

  function toISOStringDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
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

  const pasteUrl = `${window.location.origin}/${stats.link}`
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
            beforeControls={<span className="font-mono text-xs">{stats.link}</span>}
          />
          <h1 className="text-3xl font-bold tracking-tight">{t('stats.title')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{t('stats.link')}</span>
            <code className="bg-muted rounded px-2 py-0.5 text-sm">{pasteUrl}</code>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={t('action.copyLink')}
              onClick={() => copyPasteUrl(pasteUrl)}
            >
              <CopyIcon />
            </Button>
          </div>
        </header>

        <SummaryCards stats={stats} />

        {stats.geoEnabled
          ? <CountryCard byCountry={stats.byCountry} />
          : <p className="text-muted-foreground text-sm">{t('stats.geoDisabled')}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{t('stats.records')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FiltersBar
              country={country}
              onCountryChange={(next) => {
                setCountry(next)
                setPage(1)
              }}
              ipInput={ipInput}
              onIpInputChange={setIpInput}
              rangeInput={rangeInput}
              onRangeChange={setRangeInput}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              countries={stats.byCountry.map(({ country: code }) => code)}
            />

            {!views
              ? (
                  <Skeleton className="h-48 w-full" />
                )
              : (
                  <ViewsTable
                    views={views}
                    showCountry={stats.geoEnabled}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

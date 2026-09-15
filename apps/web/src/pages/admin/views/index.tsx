import type { AdminViewsPage } from '@psh/shared'
import type { DateRange } from 'react-day-picker'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { FiltersBar } from '@/components/FiltersBar'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAdminViews } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { ListPagination } from '@/pages/mine/components/ListPagination'
import { NotFound } from '@/pages/not-found'
import { AdminViewsTable } from './components/AdminViewsTable'

interface AppliedFilters {
  country: string
  ip: string
  from: string
  to: string
}

const NO_FILTERS: AppliedFilters = { country: 'ALL', ip: '', from: '', to: '' }

function toISOStringDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AdminViews() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [country, setCountry] = useState('ALL')
  const [ipInput, setIpInput] = useState('')
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>()
  const [applied, setApplied] = useState<AppliedFilters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [data, setData] = useState<AdminViewsPage | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true, state: { from: `${location.pathname}${location.search}` } })
    }
  }, [authLoading, user, navigate, location])

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return
    }
    let cancelled = false
    getAdminViews({
      page,
      pageSize,
      country: applied.country === 'ALL' ? undefined : applied.country,
      ip: applied.ip || undefined,
      from: applied.from || undefined,
      to: applied.to || undefined,
    })
      .then((next) => {
        if (!cancelled) {
          setData(next)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, page, pageSize, applied])

  function handleApply() {
    setApplied({
      country,
      ip: ipInput.trim(),
      from: rangeInput?.from ? `${toISOStringDate(rangeInput.from)}T00:00:00` : '',
      to: rangeInput?.to ? `${toISOStringDate(rangeInput.to)}T23:59:59` : '',
    })
    setPage(1)
  }

  function handleReset() {
    setCountry('ALL')
    setIpInput('')
    setRangeInput(undefined)
    setApplied(NO_FILTERS)
    setPage(1)
  }

  if (authLoading) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    )
  }

  if (!user || user.role !== 'admin') {
    return <NotFound />
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader />
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.views.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('admin.views.description')}</p>
        </header>

        <Separator />

        <FiltersBar
          country={country}
          onCountryChange={setCountry}
          ipInput={ipInput}
          onIpInputChange={setIpInput}
          rangeInput={rangeInput}
          onRangeChange={setRangeInput}
          onApply={handleApply}
          onReset={handleReset}
          countries={data?.countries ?? []}
        />

        {failed && (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              {t('error.authFailed')}
            </CardContent>
          </Card>
        )}

        {!failed && data === null && <Skeleton className="h-48 w-full" />}

        {data && (
          <>
            <AdminViewsTable rows={data.rows} showCountry={data.countries.length > 0} />
            <ListPagination
              total={data.total}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setPageSize(next)
                setPage(1)
              }}
            />
          </>
        )}
      </div>
    </main>
  )
}

import type { AdminStats as AdminStatsData } from '@psh/shared'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { CountryCard } from '@/components/CountryCard'
import { PageHeader } from '@/components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAdminStats } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { NotFound } from '@/pages/not-found'
import { RecentViewsTable } from './components/RecentViewsTable'
import { TopPastesTable } from './components/TopPastesTable'

export function AdminStats() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [stats, setStats] = useState<AdminStatsData | null>(null)
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
    getAdminStats()
      .then((next) => {
        if (!cancelled) {
          setStats(next)
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
  }, [user])

  if (authLoading) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    )
  }

  if (!user || user.role !== 'admin') {
    return <NotFound />
  }

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader />
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.stats.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('admin.stats.description')}</p>
        </header>

        <Separator />

        {failed && (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              {t('error.authFailed')}
            </CardContent>
          </Card>
        )}

        {stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>{t('admin.stats.users')}</CardDescription>
                  <CardTitle className="text-3xl">{stats.users}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>{t('admin.stats.pastes')}</CardDescription>
                  <CardTitle className="text-3xl">{stats.pastes}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>{t('admin.stats.totalViews')}</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalViews}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {stats.geoEnabled
              ? <CountryCard byCountry={stats.byCountry} />
              : <p className="text-muted-foreground text-sm">{t('stats.geoDisabled')}</p>}

            <RecentViewsTable rows={stats.recent} />
            <TopPastesTable rows={stats.topPastes} />
          </>
        )}
      </div>
    </main>
  )
}

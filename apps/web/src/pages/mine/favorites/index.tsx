import type { FavoriteItem, FavoriteListPage } from '@psh/shared'
import { FlameKindlingIcon, KeyRoundIcon, StarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMyFavorites } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { ListFilters } from '../components/ListFilters'
import { ListPagination } from '../components/ListPagination'
import { useMineListFilters } from '../components/useMineListFilters'

function formatDate(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MyFavorites() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const filters = useMineListFilters()

  const [list, setList] = useState<FavoriteListPage | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true, state: { from: `${location.pathname}${location.search}` } })
    }
  }, [authLoading, user, navigate, location])

  const { applied, page, pageSize } = filters
  useEffect(() => {
    if (!user) {
      return
    }
    let cancelled = false
    getMyFavorites({
      page,
      pageSize,
      q: applied.q || undefined,
      language: applied.language === 'ALL' ? undefined : applied.language,
      from: applied.from || undefined,
      to: applied.to || undefined,
    })
      .then((next) => {
        if (!cancelled) {
          setList(next)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled && list === null) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, page, pageSize, applied])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (authLoading || !user) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </main>
    )
  }

  const filtered = filters.hasActiveFilters(applied)
  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader />
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <StarIcon className="size-7" />
            {t('favorites.title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('favorites.description')}</p>
        </header>

        <Separator />

        <ListFilters
          qInput={filters.qInput}
          onQInputChange={filters.setQInput}
          language={filters.language}
          onLanguageChange={filters.setLanguage}
          rangeInput={filters.rangeInput}
          onRangeChange={filters.setRangeInput}
          onApply={filters.handleApply}
          onReset={filters.handleReset}
        />

        {failed && (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              {t('error.authFailed')}
            </CardContent>
          </Card>
        )}

        {!failed && list === null && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {list !== null && list.rows.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-muted-foreground text-sm">
                {filtered ? t('mine.noResults') : t('favorites.empty')}
              </p>
              {!filtered && (
                <Button size="sm" nativeButton={false} render={<Link to="/" />}>
                  {t('action.backToPsh')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {list !== null && list.rows.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('mine.col.title')}</TableHead>
                  <TableHead>{t('mine.col.link')}</TableHead>
                  <TableHead>{t('mine.col.favorited')}</TableHead>
                  <TableHead>{t('mine.col.expires')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map(item => <Row key={item.id} item={item} now={now} />)}
              </TableBody>
            </Table>
            <ListPagination
              total={list.total}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={filters.setPage}
              onPageSizeChange={filters.handlePageSizeChange}
            />
          </>
        )}
      </div>
    </main>
  )
}

function Row({ item, now }: { item: FavoriteItem, now: number }) {
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
      <TableCell className="text-muted-foreground">{formatDate(item.favoritedAt, locale)}</TableCell>
      <TableCell className="text-muted-foreground">
        {expiresAtTime === null
          ? t('badge.neverExpires')
          : expired
            ? <Badge variant="destructive">{t('badge.expired')}</Badge>
            : formatDate(item.expiresAt!, locale)}
      </TableCell>
    </TableRow>
  )
}

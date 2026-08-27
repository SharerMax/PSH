import type { MyPasteItem } from '@psh/shared'
import { EyeIcon, FlameKindlingIcon, KeyRoundIcon, LockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyPastes } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatDuration, useI18n } from '@/lib/i18n'

function formatDate(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MyPastes() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [items, setItems] = useState<MyPasteItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) {
      return
    }
    let cancelled = false
    getMyPastes()
      .then((list) => {
        if (!cancelled) {
          setItems(list)
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

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader />
          <h1 className="text-3xl font-bold tracking-tight">{t('mine.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('mine.description')}</p>
        </header>

        <Separator />

        {failed && (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              {t('error.authFailed')}
            </CardContent>
          </Card>
        )}

        {!failed && items === null && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!failed && items !== null && items.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-muted-foreground text-sm">{t('mine.empty')}</p>
              <Button size="sm" nativeButton={false} render={<Link to="/" />}>
                {t('action.backToPsh')}
              </Button>
            </CardContent>
          </Card>
        )}

        {items !== null && items.length > 0 && (
          <div className="flex flex-col gap-4">
            {items.map(item => (
              <MyPasteRow key={item.id} item={item} now={now} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function MyPasteRow({ item, now }: { item: MyPasteItem, now: number }) {
  const { t, locale } = useI18n()

  const expiresAtTime = item.expiresAt ? new Date(item.expiresAt).getTime() : null
  const expired = expiresAtTime !== null && expiresAtTime <= now

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Link to={`/${item.id}`} className="hover:underline">
            {item.title ?? t('view.untitled')}
          </Link>
          <Badge variant="secondary">{item.language}</Badge>
          {item.hasPassword && (
            <Badge variant="outline">
              <KeyRoundIcon className="size-3" />
              {t('badge.passwordProtected')}
            </Badge>
          )}
          {item.burnAfterRead && (
            <Badge variant="outline">
              <FlameKindlingIcon className="size-3" />
              {t('field.burnAfterRead')}
            </Badge>
          )}
          {expired && <Badge variant="destructive">{t('badge.expired')}</Badge>}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-mono text-xs">{item.id}</span>
          <span>{formatDate(item.createdAt, locale)}</span>
          {expiresAtTime !== null && !expired && (
            <span>{t('badge.expiresIn', { time: formatDuration(expiresAtTime - now, locale) })}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <EyeIcon className="size-4" />
          {item.views > 0
            ? (
                <span>
                  {t('mine.views', { count: item.views })}
                  {item.lastViewedAt && (
                    ` · ${t('mine.lastViewed', { time: formatDate(item.lastViewedAt, locale) })}`
                  )}
                </span>
              )
            : <span>{t('mine.neverViewed')}</span>}
        </div>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link to={`/mine/${item.id}`} />}
        >
          <LockIcon data-icon="inline-start" />
          {t('mine.manage')}
        </Button>
      </CardContent>
    </Card>
  )
}

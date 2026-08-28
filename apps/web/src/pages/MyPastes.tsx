import type { MyPasteItem } from '@psh/shared'
import { FlameKindlingIcon, KeyRoundIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { deletePasteById, getMyPastes } from '@/lib/api'
import { useAuth } from '@/lib/auth'
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

export function MyPastes() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [items, setItems] = useState<MyPasteItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [deleteTarget, setDeleteTarget] = useState<MyPasteItem | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleting)
      return
    setDeleting(true)
    try {
      await deletePasteById(deleteTarget.id)
      setItems(prev => prev?.filter(item => item.id !== deleteTarget.id) ?? prev)
      setDeleteTarget(null)
      toast.success(t('toast.pasteDeleted'))
    }
    catch {
      toast.error(t('error.deleteFailed'))
    }
    finally {
      setDeleting(false)
    }
  }

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
                <MyPasteRow
                  key={item.id}
                  item={item}
                  now={now}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog
          open={deleteTarget !== null}
          onOpenChange={open => !open && setDeleteTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('dialog.deleteDescription', { title: deleteTarget?.title ?? t('view.untitled') })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                {t('action.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? t('action.deleting') : t('action.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

function MyPasteRow({
  item,
  now,
  onDelete,
}: { item: MyPasteItem, now: number, onDelete: () => void }) {
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
            onClick={onDelete}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

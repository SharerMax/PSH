import type { MyPasteItem } from '@psh/shared'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { PasteDeleteDialog } from '@/components/PasteDeleteDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { deletePasteById, getMyPastes } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { PasteTable } from './components/PasteTable'

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
          <PasteTable items={items} now={now} onDelete={setDeleteTarget} />
        )}

        <PasteDeleteDialog
          open={deleteTarget !== null}
          onOpenChange={open => !open && setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
          title={deleteTarget?.title ?? t('view.untitled')}
        />
      </div>
    </main>
  )
}

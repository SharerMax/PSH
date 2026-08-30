import type { AdminPasteItem, AdminPasteListPage } from '@psh/shared'
import type { DateRange } from 'react-day-picker'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { PasteDeleteDialog } from '@/components/PasteDeleteDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteAdminPaste, getAdminPastes } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { ListFilters } from '@/pages/mine/components/ListFilters'
import { ListPagination } from '@/pages/mine/components/ListPagination'
import { NotFound } from '@/pages/not-found'
import { AdminPasteTable } from './components/AdminPasteTable'

function toISOStringDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface AppliedFilters {
  q: string
  language: string
  from: string
  to: string
}

const NO_FILTERS: AppliedFilters = { q: '', language: 'ALL', from: '', to: '' }

export function AdminPastes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [qInput, setQInput] = useState('')
  const [language, setLanguage] = useState('ALL')
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>()
  const [applied, setApplied] = useState<AppliedFilters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [list, setList] = useState<AdminPasteListPage | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [deleteTarget, setDeleteTarget] = useState<AdminPasteItem | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    getAdminPastes({
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
        if (!cancelled) {
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

  function handleApply() {
    setApplied({
      q: qInput.trim(),
      language,
      from: rangeInput?.from ? `${toISOStringDate(rangeInput.from)}T00:00:00` : '',
      to: rangeInput?.to ? `${toISOStringDate(rangeInput.to)}T23:59:59` : '',
    })
    setPage(1)
  }

  function handleReset() {
    setQInput('')
    setLanguage('ALL')
    setRangeInput(undefined)
    setApplied(NO_FILTERS)
    setPage(1)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleting)
      return
    setDeleting(true)
    try {
      await deleteAdminPaste(deleteTarget.id)
      if (list && list.rows.length === 1 && page > 1) {
        setPage(page - 1)
      }
      else {
        setList(prev => prev
          ? {
              ...prev,
              total: Math.max(0, prev.total - 1),
              rows: prev.rows.filter(item => item.id !== deleteTarget.id),
            }
          : prev)
      }
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

  if (authLoading) {
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

  if (!user || user.role !== 'admin') {
    return <NotFound />
  }

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader />
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.pastes.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('admin.pastes.description')}</p>
        </header>

        <Separator />

        <ListFilters
          qInput={qInput}
          onQInputChange={setQInput}
          language={language}
          onLanguageChange={setLanguage}
          rangeInput={rangeInput}
          onRangeChange={setRangeInput}
          onApply={handleApply}
          onReset={handleReset}
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
            <CardContent className="text-muted-foreground p-10 text-center text-sm">
              {t('admin.pastes.empty')}
            </CardContent>
          </Card>
        )}

        {list !== null && list.rows.length > 0 && (
          <>
            <AdminPasteTable items={list.rows} now={now} onDelete={setDeleteTarget} />
            <ListPagination
              total={list.total}
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

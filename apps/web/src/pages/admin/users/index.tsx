import type { AdminUserItem, AdminUserListPage } from '@psh/shared'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getAdminUsers, updateAdminUser } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { ListPagination } from '@/pages/mine/components/ListPagination'
import { NotFound } from '@/pages/not-found'
import { ResetPasswordDialog } from './components/ResetPasswordDialog'
import { UserDeleteDialog } from './components/UserDeleteDialog'
import { UserTable } from './components/UserTable'

export function AdminUsers() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [list, setList] = useState<AdminUserListPage | null>(null)
  const [failed, setFailed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [resetTarget, setResetTarget] = useState<AdminUserItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null)

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
    getAdminUsers({ page, pageSize, q: q || undefined })
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
  }, [user, page, pageSize, q, refreshKey])

  function handleSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setQ(qInput.trim())
    setPage(1)
  }

  async function handleToggleBan(target: AdminUserItem) {
    try {
      await updateAdminUser(target.id, { banned: !target.banned })
      setList((prev) => {
        if (!prev) {
          return prev
        }
        return {
          ...prev,
          rows: prev.rows.map(row => row.id === target.id
            ? { ...row, banned: !row.banned }
            : row),
        }
      })
      toast.success(t('toast.userUpdated'))
    }
    catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t('error.adminUpdateFailed'),
      )
    }
  }

  function handleDeleted() {
    // refresh so paste counts stay accurate after a delete
    setRefreshKey(key => key + 1)
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
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('admin.users.description')}</p>
        </header>

        <Separator />

        <form onSubmit={handleSearch} className="flex items-center gap-2" noValidate>
          <Input
            value={qInput}
            onChange={e => setQInput(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            maxLength={200}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline">
            {t('stats.apply')}
          </Button>
        </form>

        {failed && (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              {t('error.authFailed')}
            </CardContent>
          </Card>
        )}

        {!failed && list === null && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {list !== null && list.rows.length === 0 && (
          <Card>
            <CardContent className="text-muted-foreground p-10 text-center text-sm">
              {t('admin.users.empty')}
            </CardContent>
          </Card>
        )}

        {list !== null && list.rows.length > 0 && (
          <>
            <UserTable
              users={list.rows}
              currentUserId={user.id}
              onResetPassword={setResetTarget}
              onDelete={setDeleteTarget}
              onToggleBan={handleToggleBan}
            />
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

        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
        <UserDeleteDialog
          user={deleteTarget}
          onClose={() => {
            setDeleteTarget(null)
            handleDeleted()
          }}
        />
      </div>
    </main>
  )
}

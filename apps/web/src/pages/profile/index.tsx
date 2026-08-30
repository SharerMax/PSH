import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { ChangePasswordForm } from './components/ChangePasswordForm'

export function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true, state: { from: `${location.pathname}${location.search}` } })
    }
  }, [authLoading, user, navigate, location])

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
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('profile.description')}</p>
        </header>

        <Separator />

        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">{t('field.username')}</span>
              <span className="font-medium">{user.username}</span>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordForm />
      </div>
    </main>
  )
}

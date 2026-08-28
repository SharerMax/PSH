import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { useI18n } from '@/lib/i18n'
import { AuthForm } from './components/AuthForm'

export function Login() {
  const { t } = useI18n()

  return (
    <main className="bg-background flex min-h-dvh flex-col px-4">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-4 py-4">
        <PageHeader showAccount={false} />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center pb-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <AuthForm />
          <div className="text-center">
            <Link to="/" className="text-muted-foreground text-sm hover:underline">
              {t('action.backToPsh')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

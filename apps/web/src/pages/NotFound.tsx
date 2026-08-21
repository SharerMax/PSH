import { Link } from 'react-router'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function NotFound() {
  const { t } = useI18n()

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-7xl font-bold tracking-tight">{t('notFound.code')}</h1>
        <p className="text-muted-foreground">{t('notFound.description')}</p>
      </div>
      <Button nativeButton={false} render={<Link to="/" />}>
        {t('action.backToPsh')}
      </Button>
    </main>
  )
}

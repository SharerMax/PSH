import { LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <Button
      size="sm"
      variant="ghost"
      aria-label={locale === 'en' ? '切换到中文' : 'Switch to English'}
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
    >
      <LanguagesIcon data-icon="inline-start" />
      {locale === 'en' ? '中文' : 'English'}
    </Button>
  )
}

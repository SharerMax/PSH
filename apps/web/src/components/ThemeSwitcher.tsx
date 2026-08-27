import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/lib/i18n'

const OPTIONS = [
  { value: 'light', labelKey: 'theme.light', icon: SunIcon },
  { value: 'dark', labelKey: 'theme.dark', icon: MoonIcon },
  { value: 'system', labelKey: 'theme.system', icon: MonitorIcon },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  const current = OPTIONS.find(option => option.value === theme) ?? OPTIONS[2]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('theme.title')}
            title={t('theme.title')}
          />
        )}
      >
        <CurrentIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 min-w-fit">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={setTheme}
        >
          {OPTIONS.map(({ value, labelKey, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon data-icon="inline-start" />
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

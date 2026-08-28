import type { ExpiryOption, PasteLanguage } from '@psh/shared'
import { EXPIRY_OPTIONS, PASTE_LANGUAGES } from '@psh/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n'

export interface PasteOptions {
  title: string
  language: PasteLanguage
  expiresIn: ExpiryOption
  link: string
  password: string
  burnAfterRead: boolean
}

interface OptionsPanelProps {
  value: PasteOptions
  onChange: (patch: Partial<PasteOptions>) => void
  submitting: boolean
}

export function OptionsPanel({ value, onChange, submitting }: OptionsPanelProps) {
  const { t } = useI18n()

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-65 xl:w-75">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t('field.title')}</Label>
        <Input
          id="title"
          value={value.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder={t('placeholder.untitled')}
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="language">{t('field.language')}</Label>
        <Select
          value={value.language}
          onValueChange={next => onChange({ language: next as PasteLanguage })}
        >
          <SelectTrigger id="language" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PASTE_LANGUAGES.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expiresIn">{t('field.expiresIn')}</Label>
        <Select
          value={value.expiresIn}
          onValueChange={next => onChange({ expiresIn: next as ExpiryOption })}
        >
          <SelectTrigger id="expiresIn" className="w-full">
            <SelectValue>{t(`expiry.${value.expiresIn}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_OPTIONS.map(option => (
              <SelectItem key={option} value={option}>
                {t(`expiry.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="link">{t('field.customLink')}</Label>
        <Input
          id="link"
          value={value.link}
          onChange={e => onChange({ link: e.target.value })}
          placeholder={t('placeholder.customLink')}
          maxLength={32}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('field.password')}</Label>
        <Input
          id="password"
          type="password"
          value={value.password}
          onChange={e => onChange({ password: e.target.value })}
          placeholder={t('placeholder.password')}
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="burnAfterRead">{t('field.burnAfterRead')}</Label>
        <p className="text-muted-foreground text-xs">{t('description.burnAfterRead')}</p>
        <Switch
          id="burnAfterRead"
          checked={value.burnAfterRead}
          onCheckedChange={checked => onChange({ burnAfterRead: checked })}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full lg:mt-auto">
        {submitting ? t('action.creating') : t('action.create')}
      </Button>
    </aside>
  )
}

import type { PasteLanguage } from '@psh/shared'
import { PASTE_LANGUAGES } from '@psh/shared'
import { CodeEditor } from '@/components/CodeEditor'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n'

export interface EditFormValue {
  title: string
  language: PasteLanguage
  content: string | null
  pastePassword: string
}

interface EditFormProps {
  value: EditFormValue
  onChange: (patch: Partial<EditFormValue>) => void
  hasPassword: boolean
  saving: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function EditForm({ value, onChange, hasPassword, saving, onSubmit }: EditFormProps) {
  const { t, locale } = useI18n()
  const contentBytes = value.content === null
    ? 0
    : new TextEncoder().encode(value.content).byteLength

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6 lg:flex-row" noValidate>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="content">{t('field.content')}</Label>
        {value.content === null
          ? <Skeleton className="min-h-40 w-full" />
          : (
              <CodeEditor
                id="content"
                value={value.content}
                onChange={next => onChange({ content: next })}
                language={value.language}
                ariaLabel={t('field.content')}
                placeholder={t('placeholder.content')}
                className="flex-1"
              />
            )}
        {value.content !== null && (
          <p className="text-muted-foreground text-right text-xs">
            {t('bytes.counter', { count: contentBytes.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') })}
          </p>
        )}
      </div>

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

        {hasPassword && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="paste-password">{t('edit.currentPassword')}</Label>
            <Input
              id="paste-password"
              type="password"
              value={value.pastePassword}
              onChange={e => onChange({ pastePassword: e.target.value })}
              autoComplete="off"
            />
            <p className="text-muted-foreground text-xs">{t('edit.needPassword')}</p>
          </div>
        )}

        <Button type="submit" disabled={saving || value.content === null} className="w-full lg:mt-auto">
          {saving ? t('action.saving') : t('action.save')}
        </Button>
      </aside>
    </form>
  )
}

import { CodeEditor } from '@/components/CodeEditor'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

interface EditorPanelProps {
  content: string
  language: string
  onChange: (value: string) => void
}

export function EditorPanel({ content, language, onChange }: EditorPanelProps) {
  const { t, locale } = useI18n()
  const contentBytes = new TextEncoder().encode(content).byteLength

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor="content">{t('field.content')}</Label>
      <CodeEditor
        id="content"
        value={content}
        onChange={onChange}
        language={language}
        ariaLabel={t('field.content')}
        placeholder={t('placeholder.content')}
        className="flex-1"
      />
      <p className="text-muted-foreground text-right text-xs">
        {t('bytes.counter', { count: contentBytes.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') })}
      </p>
    </div>
  )
}

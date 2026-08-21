import type { ExpiryOption, PasteLanguage } from '@psh/shared'
import {
  EXPIRY_OPTIONS,

  PASTE_LANGUAGES,

} from '@psh/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { createPaste } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

const MAX_CONTENT_BYTES = 1024 * 1024

export function Home() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()

  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<PasteLanguage>('plaintext')
  const [content, setContent] = useState('')
  const [expiresIn, setExpiresIn] = useState<ExpiryOption>('forever')
  const [password, setPassword] = useState('')
  const [burnAfterRead, setBurnAfterRead] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const contentBytes = new TextEncoder().encode(content).byteLength

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) {
      toast.error(t('error.contentRequired'))
      return
    }
    if (contentBytes > MAX_CONTENT_BYTES) {
      toast.error(t('error.contentTooLarge'))
      return
    }

    setSubmitting(true)
    try {
      const { id } = await createPaste({
        title: title.trim() || undefined,
        language,
        content,
        expiresIn,
        password: password || undefined,
        burnAfterRead,
      })
      toast.success(t('toast.pasteCreated'))
      navigate(`/${id}`)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : t('error.createFailed'))
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link to="/" className="text-3xl font-bold tracking-tight">
              psh
            </Link>
            <p className="text-muted-foreground text-sm">{t('app.tagline')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{t('home.newPaste')}</CardTitle>
            <CardDescription>{t('home.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">{t('field.title')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('placeholder.untitled')}
                  maxLength={200}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="language">{t('field.language')}</Label>
                <Select value={language} onValueChange={value => setLanguage(value as PasteLanguage)}>
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
                <Label htmlFor="content">{t('field.content')}</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={t('placeholder.content')}
                  className="min-h-64 font-mono"
                  spellCheck={false}
                />
                <p className="text-muted-foreground text-right text-xs">
                  {t('bytes.counter', { count: contentBytes.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="expiresIn">{t('field.expiresIn')}</Label>
                <Select value={expiresIn} onValueChange={value => setExpiresIn(value as ExpiryOption)}>
                  <SelectTrigger id="expiresIn" className="w-full">
                    <SelectValue />
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
                <Label htmlFor="password">{t('field.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('placeholder.password')}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="burnAfterRead">{t('field.burnAfterRead')}</Label>
                  <p className="text-muted-foreground text-xs">{t('description.burnAfterRead')}</p>
                </div>
                <Switch
                  id="burnAfterRead"
                  checked={burnAfterRead}
                  onCheckedChange={setBurnAfterRead}
                />
              </div>

              <Button type="submit" disabled={submitting} className="self-start">
                {submitting ? t('action.creating') : t('action.create')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

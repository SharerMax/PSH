import type { PasteOptions } from './components/OptionsPanel'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError, createPaste } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { EditorPanel } from './components/EditorPanel'
import { OptionsPanel } from './components/OptionsPanel'

const MAX_CONTENT_BYTES = 1024 * 1024

export function Home() {
  const navigate = useNavigate()
  const { t } = useI18n()

  const [content, setContent] = useState('')
  const [options, setOptions] = useState<PasteOptions>({
    title: '',
    language: 'plaintext',
    expiresIn: 'forever',
    link: '',
    password: '',
    burnAfterRead: false,
  })
  const [submitting, setSubmitting] = useState(false)

  function patchOptions(patch: Partial<PasteOptions>) {
    setOptions(prev => ({ ...prev, ...patch }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) {
      toast.error(t('error.contentRequired'))
      return
    }
    if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES) {
      toast.error(t('error.contentTooLarge'))
      return
    }
    const trimmedLink = options.link.trim()
    if (trimmedLink && !/^[\w.-]{4,32}$/.test(trimmedLink)) {
      toast.error(t('error.customLinkInvalid'))
      return
    }

    setSubmitting(true)
    try {
      const { link } = await createPaste({
        title: options.title.trim() || undefined,
        language: options.language,
        content,
        expiresIn: options.expiresIn,
        password: options.password || undefined,
        burnAfterRead: options.burnAfterRead,
        link: trimmedLink || undefined,
      })
      toast.success(t('toast.pasteCreated'))
      navigate(`/${link}`)
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t('error.customLinkTaken'))
      }
      else {
        toast.error(error instanceof Error ? error.message : t('error.createFailed'))
      }
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-background flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link to="/" className="text-3xl font-bold tracking-tight">
              psh
            </Link>
            <p className="text-muted-foreground text-sm">{t('app.tagline')}</p>
          </div>
          <PageHeader left={null} />
        </header>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>{t('home.newPaste')}</CardTitle>
            <CardDescription>{t('home.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 lg:flex-row" noValidate>
              <EditorPanel
                content={content}
                language={options.language}
                onChange={setContent}
              />
              <OptionsPanel
                value={options}
                onChange={patchOptions}
                submitting={submitting}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

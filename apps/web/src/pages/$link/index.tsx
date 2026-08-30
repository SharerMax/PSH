import type { PasteMeta } from '@psh/shared'
import { FlameKindlingIcon, LockIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { PasteUnlockDialog } from '@/components/PasteUnlockDialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getPasteContent, getPasteMeta } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { ActionBar } from './components/ActionBar'
import { CodeBlock } from './components/CodeBlock'
import { FavoriteButton } from './components/FavoriteButton'
import { PasteHeader } from './components/PasteHeader'

export function PasteView() {
  const { link = '' } = useParams()
  const { t } = useI18n()

  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [meta, setMeta] = useState<PasteMeta | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // guards against StrictMode double-invocation burning a paste twice
  const contentRequestedRef = useRef(false)

  const loadContent = useCallback(async (pasteLink: string, pastePassword?: string) => {
    try {
      const payload = await getPasteContent(pasteLink, pastePassword)
      setContent(payload.content)
      setPasswordDialogOpen(false)
      setPasswordError(false)
      return true
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPasswordError(true)
        return false
      }
      setPhase('gone')
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const fetchedMeta = await getPasteMeta(link)
        if (cancelled)
          return

        setMeta(fetchedMeta)
        setPhase('ready')

        if (fetchedMeta.hasPassword) {
          setPasswordDialogOpen(true)
          return
        }

        if (!contentRequestedRef.current) {
          contentRequestedRef.current = true
          await loadContent(link)
        }
      }
      catch (error) {
        if (cancelled)
          return
        setPhase('gone')
        if (!(error instanceof ApiError)) {
          console.error(error)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [link, loadContent])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function handlePasswordSubmit() {
    if (!password || submittingPassword)
      return

    setSubmittingPassword(true)
    try {
      const unlocked = await loadContent(link, password)
      if (unlocked) {
        toast.success(t('toast.unlocked'))
        setPassword('')
      }
    }
    finally {
      setSubmittingPassword(false)
    }
  }

  function handleDialogOpenChange(open: boolean) {
    // once locked, the dialog must stay open until a correct password unlocks it
    if (meta?.hasPassword && content === null && !open)
      return
    setPasswordDialogOpen(open)
    if (!open)
      setPasswordError(false)
  }

  if (phase === 'gone') {
    return (
      <main className="bg-background flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <FlameKindlingIcon className="size-5" />
              {t('view.goneTitle')}
            </CardTitle>
            <CardDescription>{t('view.goneDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button nativeButton={false} render={<Link to="/" />}>
              {t('action.createNew')}
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (phase === 'loading' || !meta) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="min-h-64 w-full" />
        </div>
      </main>
    )
  }

  const burned = meta.burnAfterRead && content !== null
  const locked = content === null

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader beforeControls={<span className="font-mono text-xs">{link}</span>} />
          <PasteHeader meta={meta} now={now} burned={burned} />
        </header>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <ActionBar content={content} link={link} />
          <FavoriteButton link={link} />
        </div>

        {locked
          ? (
              <Card>
                <CardContent className="text-muted-foreground flex items-center justify-center gap-2 p-10 text-sm">
                  <LockIcon className="size-4" />
                  {t('view.lockedNotice')}
                </CardContent>
              </Card>
            )
          : (
              <CodeBlock content={content!} language={meta.language} />
            )}

        <PasteUnlockDialog
          open={passwordDialogOpen}
          onOpenChange={handleDialogOpenChange}
          password={password}
          onPasswordChange={setPassword}
          error={passwordError}
          submitting={submittingPassword}
          onSubmit={handlePasswordSubmit}
        />
      </div>
    </main>
  )
}

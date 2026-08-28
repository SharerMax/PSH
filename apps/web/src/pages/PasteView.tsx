import type { PasteMeta } from '@psh/shared'
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FlameKindlingIcon,
  LockIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { codeToHtml } from 'shiki'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getPasteContent, getPasteMeta } from '@/lib/api'
import { formatDuration, useI18n } from '@/lib/i18n'

type CodeThemeChoice = 'auto' | 'light' | 'dark'

const CODE_THEME_OPTIONS: Array<{
  value: CodeThemeChoice
  labelKey: 'code.theme.auto' | 'code.theme.light' | 'code.theme.dark'
  icon: typeof MonitorIcon
}> = [
  { value: 'auto', labelKey: 'code.theme.auto', icon: MonitorIcon },
  { value: 'light', labelKey: 'code.theme.light', icon: SunIcon },
  { value: 'dark', labelKey: 'code.theme.dark', icon: MoonIcon },
]

async function highlight(code: string, language: string, theme: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang: language, theme })
  }
  catch {
    try {
      return await codeToHtml(code, { lang: 'plaintext', theme })
    }
    catch {
      return ''
    }
  }
}

export function PasteView() {
  const { link = '' } = useParams()
  const { t, locale } = useI18n()
  const { resolvedTheme } = useTheme()

  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [meta, setMeta] = useState<PasteMeta | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordErrorKey, setPasswordErrorKey] = useState<'error.wrongPassword' | null>(null)
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [codeThemeChoice, setCodeThemeChoice] = useState<CodeThemeChoice>('auto')

  // 'auto' follows the page theme; otherwise the explicit choice wins
  const effectiveCodeTheme
    = (codeThemeChoice === 'auto' ? resolvedTheme ?? 'light' : codeThemeChoice) === 'dark'
      ? 'github-dark-default'
      : 'github-light-default'

  // guards against StrictMode double-invocation burning a paste twice
  const contentRequestedRef = useRef(false)

  const loadContent = useCallback(async (pasteLink: string, pastePassword?: string) => {
    try {
      const payload = await getPasteContent(pasteLink, pastePassword)
      setContent(payload.content)
      setPasswordDialogOpen(false)
      setPasswordErrorKey(null)
      return true
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPasswordErrorKey('error.wrongPassword')
        return false
      }
      setPhase('gone')
      return false
    }
  }, [])

  useEffect(() => {
    if (content === null || !meta) {
      return
    }
    let cancelled = false
    highlight(content, meta.language, effectiveCodeTheme).then((html) => {
      if (!cancelled) {
        setHighlightedHtml(html)
      }
    })
    return () => {
      cancelled = true
    }
  }, [content, meta?.language, effectiveCodeTheme])

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

  async function copyText(text: string, successMessage: string, failureMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    }
    catch {
      toast.error(failureMessage)
    }
  }

  function handleDownload() {
    if (content === null)
      return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${link}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t('toast.downloadStarted'))
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      setPasswordErrorKey(null)
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

  const expiresAtTime = meta.expiresAt ? new Date(meta.expiresAt).getTime() : null
  const expired = expiresAtTime !== null && expiresAtTime <= now
  const burned = meta.burnAfterRead && content !== null
  const rawHref = `/raw/link/${link}`
  const locked = content === null

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader beforeControls={<span className="font-mono text-xs">{link}</span>} />
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {meta.title ?? t('view.untitled')}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{meta.language}</Badge>
            {meta.hasPassword && (
              <Badge variant="outline">{t('badge.passwordProtected')}</Badge>
            )}
            {burned && (
              <Badge variant="destructive">
                <FlameKindlingIcon className="size-3" />
                {t('badge.destroyedAfterRead')}
              </Badge>
            )}
            {expiresAtTime === null && !burned && (
              <Badge variant="secondary">{t('badge.neverExpires')}</Badge>
            )}
            {expiresAtTime !== null && !expired && !burned && (
              <Badge variant="secondary">
                {t('badge.expiresIn', { time: formatDuration(expiresAtTime - now, locale) })}
              </Badge>
            )}
            {expired && !burned && <Badge variant="destructive">{t('badge.expired')}</Badge>}
          </div>
        </header>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={locked}
            onClick={() => content !== null && copyText(content, t('toast.copiedContent'), t('error.copyContent'))}
          >
            <CopyIcon data-icon="inline-start" />
            {t('action.copyContent')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyText(window.location.href, t('toast.copiedLink'), t('error.copyLink'))}
          >
            <CopyIcon data-icon="inline-start" />
            {t('action.copyLink')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<a href={rawHref} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            {t('action.raw')}
          </Button>
          <Button size="sm" variant="outline" disabled={locked} onClick={handleDownload}>
            <DownloadIcon data-icon="inline-start" />
            {t('action.download')}
          </Button>
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
              <div className="relative">
                <div className="bg-background/80 border-border/60 absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-md border p-0.5 backdrop-blur-sm">
                  {CODE_THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
                    <Button
                      key={value}
                      size="icon-xs"
                      variant={codeThemeChoice === value ? 'secondary' : 'ghost'}
                      aria-label={t(labelKey)}
                      title={t(labelKey)}
                      onClick={() => setCodeThemeChoice(value)}
                    >
                      <Icon />
                    </Button>
                  ))}
                </div>

                {highlightedHtml
                  ? (
                      <Card className="overflow-hidden p-0">
                        <CardContent className="p-0">
                          <div
                            className="[&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-none [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                          />
                        </CardContent>
                      </Card>
                    )
                  : (
                      <Card className="p-0">
                        <CardContent className="p-0">
                          <pre className="bg-card overflow-x-auto p-4 font-mono text-sm leading-relaxed">{content}</pre>
                        </CardContent>
                      </Card>
                    )}
              </div>
            )}

        <Dialog open={passwordDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{t('dialog.passwordTitle')}</DialogTitle>
              <DialogDescription>{t('dialog.passwordDescription')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="paste-password">{t('dialog.passwordLabel')}</Label>
                <Input
                  id="paste-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="off"
                />
                {passwordErrorKey && <p className="text-destructive text-sm">{t(passwordErrorKey)}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!password || submittingPassword}>
                  {submittingPassword ? t('action.unlocking') : t('action.unlock')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

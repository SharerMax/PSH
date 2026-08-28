import type { PasteLanguage, PasteStats } from '@psh/shared'
import { PASTE_LANGUAGES } from '@psh/shared'
import { GlobeIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { CodeEditor } from '@/components/CodeEditor'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, getPasteContent, getPasteMeta, getPasteStats, updatePaste } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

const MAX_CONTENT_BYTES = 1024 * 1024

function formatDateTime(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PasteManage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [hasPassword, setHasPassword] = useState(false)
  const [stats, setStats] = useState<PasteStats | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [pastePassword, setPastePassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)

  // editable fields
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<PasteLanguage>('plaintext')
  const [content, setContent] = useState<string | null>(null)

  const contentRequestedRef = useRef(false)
  const contentBytes = content === null ? 0 : new TextEncoder().encode(content).byteLength

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  const loadContent = useCallback(async (pasteId: string, password?: string) => {
    try {
      const payload = await getPasteContent(pasteId, password)
      setTitle(payload.title ?? '')
      setLanguage(payload.language as PasteLanguage)
      setContent(payload.content)
      setPasswordDialogOpen(false)
      setPasswordError(false)
      return true
    }
    catch {
      setPasswordError(true)
      return false
    }
  }, [])

  const loadStats = useCallback(async (pasteId: string) => {
    try {
      setStats(await getPasteStats(pasteId))
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setPhase('gone')
      }
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }
    let cancelled = false

    async function load() {
      try {
        const meta = await getPasteMeta(id)
        if (cancelled)
          return
        setHasPassword(meta.hasPassword)
        setPhase('ready')
        await loadStats(id)
        if (meta.hasPassword) {
          setPasswordDialogOpen(true)
        }
        else if (!contentRequestedRef.current) {
          contentRequestedRef.current = true
          await loadContent(id)
        }
      }
      catch {
        if (!cancelled) {
          setPhase('gone')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, user, loadContent, loadStats])

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pastePassword || submittingPassword)
      return
    setSubmittingPassword(true)
    try {
      const unlocked = await loadContent(id, pastePassword)
      if (unlocked) {
        contentRequestedRef.current = true
        toast.success(t('toast.unlocked'))
      }
    }
    finally {
      setSubmittingPassword(false)
    }
  }

  function handleDialogOpenChange(open: boolean) {
    if (hasPassword && content === null && !open)
      return
    setPasswordDialogOpen(open)
    if (!open)
      setPasswordError(false)
  }

  const [saving, setSaving] = useState(false)

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (content === null || saving)
      return
    if (!content.trim()) {
      toast.error(t('error.contentRequired'))
      return
    }
    if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES) {
      toast.error(t('error.contentTooLarge'))
      return
    }

    setSaving(true)
    try {
      await updatePaste(id, {
        title: title.trim() || undefined,
        language,
        content,
        password: hasPassword ? pastePassword : undefined,
      })
      toast.success(t('toast.pasteUpdated'))
      await loadStats(id)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : t('error.updateFailed'))
    }
    finally {
      setSaving(false)
    }
  }

  if (phase === 'gone') {
    return (
      <main className="bg-background flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('view.goneTitle')}</CardTitle>
            <CardDescription>{t('view.goneDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button nativeButton={false} render={<Link to="/mine" />}>
              {t('nav.myPastes')}
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (phase === 'loading' || authLoading || !user) {
    return (
      <main className="bg-background min-h-dvh">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="min-h-40 w-full" />
          <Skeleton className="min-h-40 w-full" />
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <PageHeader
            left={(
              <Link to="/mine" className="text-muted-foreground text-sm hover:underline">
                {t('nav.myPastes')}
              </Link>
            )}
            beforeControls={<span className="font-mono text-xs">{id}</span>}
          />
          <h1 className="text-3xl font-bold tracking-tight">{t('manage.title')}</h1>
          <div className="flex flex-wrap items-start gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link to={`/${id}`} />}
            >
              {t('action.viewPaste')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link to={`/mine/${id}/stats`} />}
            >
              {t('stats.title')}
            </Button>
          </div>
          {stats && stats.totalViews > 0 && (
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                {t('stats.totalViews')}
                {' '}
                <span className="text-foreground font-medium">{stats.totalViews}</span>
              </span>
              {stats.lastViewedAt && (
                <span>
                  {t('stats.lastViewed')}
                  {' '}
                  {formatDateTime(stats.lastViewedAt, locale)}
                </span>
              )}
              {stats.recent[0] && (
                <span className="inline-flex items-center gap-1">
                  {t('stats.lastIp')}
                  {' '}
                  <span className="text-foreground font-mono text-xs">
                    {stats.recent[0].ip ?? '—'}
                  </span>
                  {stats.geoEnabled && (
                    <Badge variant="secondary" className="px-1.5 py-0">
                      <GlobeIcon className="size-3" />
                      {stats.recent[0].country}
                    </Badge>
                  )}
                </span>
              )}
            </div>
          )}
          {stats && stats.totalViews === 0 && (
            <p className="text-muted-foreground text-sm">{t('stats.noData')}</p>
          )}
        </header>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>{t('edit.title')}</CardTitle>
            <CardDescription>{t('edit.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <form onSubmit={handleSave} className="flex flex-1 flex-col gap-6 lg:flex-row" noValidate>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Label htmlFor="content">{t('field.content')}</Label>
                {content === null
                  ? <Skeleton className="min-h-40 w-full" />
                  : (
                      <CodeEditor
                        id="content"
                        value={content}
                        onChange={setContent}
                        language={language}
                        ariaLabel={t('field.content')}
                        placeholder={t('placeholder.content')}
                        className="flex-1"
                      />
                    )}
                {content !== null && (
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

                {hasPassword && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="paste-password">{t('edit.currentPassword')}</Label>
                    <Input
                      id="paste-password"
                      type="password"
                      value={pastePassword}
                      onChange={e => setPastePassword(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-muted-foreground text-xs">{t('edit.needPassword')}</p>
                  </div>
                )}

                <Button type="submit" disabled={saving || content === null} className="w-full lg:mt-auto">
                  {saving ? t('action.saving') : t('action.save')}
                </Button>
              </aside>
            </form>
          </CardContent>
        </Card>

        <Dialog open={passwordDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{t('dialog.passwordTitle')}</DialogTitle>
              <DialogDescription>{t('dialog.passwordDescription')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="manage-paste-password">{t('dialog.passwordLabel')}</Label>
                <Input
                  id="manage-paste-password"
                  type="password"
                  value={pastePassword}
                  onChange={e => setPastePassword(e.target.value)}
                  autoComplete="off"
                />
                {passwordError && <p className="text-destructive text-sm">{t('error.wrongPassword')}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!pastePassword || submittingPassword}>
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

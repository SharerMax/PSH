import type { PasteLanguage, PasteStats } from '@psh/shared'
import type { EditFormValue } from './components/EditForm'
import { Trash2Icon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { PasteDeleteDialog } from '@/components/PasteDeleteDialog'
import { PasteUnlockDialog } from '@/components/PasteUnlockDialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { deletePasteById, getPasteContentById, getPasteMetaById, getPasteStats, updatePasteById } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { EditForm } from './components/EditForm'
import { StatsSummary } from './components/StatsSummary'

const MAX_CONTENT_BYTES = 1024 * 1024

export function PasteManage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()

  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [link, setLink] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [stats, setStats] = useState<PasteStats | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)

  const [form, setForm] = useState<EditFormValue>({
    title: '',
    language: 'plaintext',
    content: null,
    pastePassword: '',
  })
  const [saving, setSaving] = useState(false)

  // guards against StrictMode double-invocation loading content twice
  const contentRequestedRef = useRef(false)

  function patchForm(patch: Partial<EditFormValue>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  const loadContent = useCallback(async (pasteId: number, password?: string) => {
    try {
      const payload = await getPasteContentById(pasteId, password)
      patchForm({
        title: payload.title ?? '',
        language: payload.language as PasteLanguage,
        content: payload.content,
      })
      setPasswordDialogOpen(false)
      setPasswordError(false)
      return true
    }
    catch {
      setPasswordError(true)
      return false
    }
  }, [])

  const loadStats = useCallback(async (pasteId: number) => {
    setStats(await getPasteStats(pasteId).catch(() => null))
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }
    let cancelled = false

    async function load() {
      try {
        const meta = await getPasteMetaById(Number(id))
        if (cancelled)
          return
        setLink(meta.link)
        setHasPassword(meta.hasPassword)
        setPhase('ready')
        loadStats(Number(id))
        if (meta.hasPassword) {
          setPasswordDialogOpen(true)
        }
        else if (!contentRequestedRef.current) {
          contentRequestedRef.current = true
          await loadContent(Number(id))
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

  async function handleUnlock() {
    if (!form.pastePassword || submittingPassword)
      return
    setSubmittingPassword(true)
    try {
      const unlocked = await loadContent(Number(id), form.pastePassword)
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
    if (hasPassword && form.content === null && !open)
      return
    setPasswordDialogOpen(open)
    if (!open)
      setPasswordError(false)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.content === null || saving)
      return
    if (!form.content.trim()) {
      toast.error(t('error.contentRequired'))
      return
    }
    if (new TextEncoder().encode(form.content).byteLength > MAX_CONTENT_BYTES) {
      toast.error(t('error.contentTooLarge'))
      return
    }

    setSaving(true)
    try {
      await updatePasteById(Number(id), {
        title: form.title.trim() || undefined,
        language: form.language,
        content: form.content,
        password: hasPassword ? form.pastePassword : undefined,
      })
      toast.success(t('toast.pasteUpdated'))
      await loadStats(Number(id))
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : t('error.updateFailed'))
    }
    finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting)
      return
    setDeleting(true)
    try {
      await deletePasteById(Number(id))
      toast.success(t('toast.pasteDeleted'))
      navigate('/mine')
    }
    catch {
      toast.error(t('error.deleteFailed'))
    }
    finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
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
            beforeControls={<span className="font-mono text-xs">{link}</span>}
          />
          <h1 className="text-3xl font-bold tracking-tight">{t('manage.title')}</h1>
          <div className="flex flex-wrap items-start gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link to={`/${link}`} />}
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
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              {t('action.delete')}
            </Button>
          </div>
          {stats && <StatsSummary stats={stats} />}
        </header>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>{t('edit.title')}</CardTitle>
            <CardDescription>{t('edit.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <EditForm
              value={form}
              onChange={patchForm}
              hasPassword={hasPassword}
              saving={saving}
              onSubmit={handleSave}
            />
          </CardContent>
        </Card>

        <PasteDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          deleting={deleting}
          title={form.title.trim() || link || t('view.untitled')}
        />

        <PasteUnlockDialog
          open={passwordDialogOpen}
          onOpenChange={handleDialogOpenChange}
          password={form.pastePassword}
          onPasswordChange={value => patchForm({ pastePassword: value })}
          error={passwordError}
          submitting={submittingPassword}
          onSubmit={handleUnlock}
        />
      </div>
    </main>
  )
}

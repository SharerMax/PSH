import type { PasteMeta } from '@psh/shared'
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FlameKindlingIcon,
  LockIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { codeToHtml } from 'shiki'
import { toast } from 'sonner'
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

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0)
    return `${days}d ${hours}h ${minutes}m`
  if (hours > 0)
    return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

async function highlight(code: string, language: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang: language, theme: 'github-dark-default' })
  }
  catch {
    try {
      return await codeToHtml(code, { lang: 'plaintext', theme: 'github-dark-default' })
    }
    catch {
      return ''
    }
  }
}

export function PasteView() {
  const { id = '' } = useParams()

  const [phase, setPhase] = useState<'loading' | 'gone' | 'ready'>('loading')
  const [meta, setMeta] = useState<PasteMeta | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // guards against StrictMode double-invocation burning a paste twice
  const contentRequestedRef = useRef(false)

  const loadContent = useCallback(async (pasteId: string, pastePassword?: string) => {
    try {
      const payload = await getPasteContent(pasteId, pastePassword)
      setContent(payload.content)
      setHighlightedHtml(await highlight(payload.content, payload.language))
      setPasswordDialogOpen(false)
      setPasswordError(null)
      return true
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPasswordError('Wrong password')
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
        const fetchedMeta = await getPasteMeta(id)
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
          await loadContent(id)
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
  }, [id, loadContent])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function handleCopyText(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied to clipboard`)
    }
    catch {
      toast.error(`Failed to copy ${what.toLowerCase()}`)
    }
  }

  function handleDownload() {
    if (content === null)
      return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${id}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password || submittingPassword)
      return

    setSubmittingPassword(true)
    try {
      const ok = await loadContent(id, password)
      if (ok) {
        toast.success('Paste unlocked')
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
      setPasswordError(null)
  }

  if (phase === 'gone') {
    return (
      <main className="bg-background flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <FlameKindlingIcon className="size-5" />
              Nothing here
            </CardTitle>
            <CardDescription>
              This paste does not exist, was destroyed after reading, or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button render={<Link to="/" />}>Create a new paste</Button>
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
  const rawHref = `/raw/${id}`
  const locked = content === null

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <Link to="/" className="text-muted-foreground text-sm hover:underline">
              psh
            </Link>
            <span className="font-mono text-xs">{id}</span>
          </div>
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {meta.title ?? 'Untitled paste'}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{meta.language}</Badge>
            {meta.hasPassword && <Badge variant="outline">password protected</Badge>}
            {burned && (
              <Badge variant="destructive">
                <FlameKindlingIcon className="size-3" />
                destroyed after read
              </Badge>
            )}
            {expiresAtTime === null && !burned && <Badge variant="secondary">never expires</Badge>}
            {expiresAtTime !== null && !expired && !burned && (
              <Badge variant="secondary">
                expires in
                {' '}
                {formatRemaining(expiresAtTime - now)}
              </Badge>
            )}
            {expired && !burned && <Badge variant="destructive">expired</Badge>}
          </div>
        </header>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={locked}
            onClick={() => content !== null && handleCopyText(content, 'Content')}
          >
            <CopyIcon data-icon="inline-start" />
            Copy content
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyText(window.location.href, 'Link')}
          >
            <CopyIcon data-icon="inline-start" />
            Copy link
          </Button>
          <Button size="sm" variant="outline" render={<a href={rawHref} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon data-icon="inline-start" />
            Raw
          </Button>
          <Button size="sm" variant="outline" disabled={locked} onClick={handleDownload}>
            <DownloadIcon data-icon="inline-start" />
            Download
          </Button>
        </div>

        {locked
          ? (
              <Card>
                <CardContent className="text-muted-foreground flex items-center justify-center gap-2 p-10 text-sm">
                  <LockIcon className="size-4" />
                  Content is hidden until you enter the correct password.
                </CardContent>
              </Card>
            )
          : highlightedHtml
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

        <Dialog open={passwordDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Password required</DialogTitle>
              <DialogDescription>
                This paste is protected. Enter the password to view its content.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="paste-password">Password</Label>
                <Input
                  id="paste-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="off"
                />
                {passwordError && <p className="text-destructive text-sm">{passwordError}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!password || submittingPassword}>
                  {submittingPassword ? 'Unlocking…' : 'Unlock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

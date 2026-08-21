import type { ExpiryOption, PasteLanguage } from '@psh/shared'
import { EXPIRY_OPTIONS, PASTE_LANGUAGES } from '@psh/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
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

const EXPIRY_LABELS: Record<ExpiryOption, string> = {
  '10min': '10 minutes',
  '1h': '1 hour',
  '1d': '1 day',
  '7d': '7 days',
  'forever': 'Never',
}

const MAX_CONTENT_BYTES = 1024 * 1024

export function Home() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<PasteLanguage>('plaintext')
  const [content, setContent] = useState('')
  const [expiresIn, setExpiresIn] = useState<ExpiryOption>('forever')
  const [password, setPassword] = useState('')
  const [burnAfterRead, setBurnAfterRead] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }
    if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES) {
      toast.error('Content exceeds the 1 MB limit')
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
      toast.success('Paste created')
      navigate(`/${id}`)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create paste')
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-background min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-1">
          <Link to="/" className="text-3xl font-bold tracking-tight">
            psh
          </Link>
          <p className="text-muted-foreground text-sm">
            Share code snippets with optional passwords, expiry and burn-after-read.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>New paste</CardTitle>
            <CardDescription>Everything is optional except the content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Untitled"
                  maxLength={200}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={value => setLanguage(value as PasteLanguage)}>
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PASTE_LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your text here…"
                  className="min-h-64 font-mono"
                  spellCheck={false}
                />
                <p className="text-muted-foreground text-right text-xs">
                  {new TextEncoder().encode(content).byteLength.toLocaleString()}
                  {' '}
                  / 1,048,576 bytes
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="expiresIn">Expires in</Label>
                <Select value={expiresIn} onValueChange={value => setExpiresIn(value as ExpiryOption)}>
                  <SelectTrigger id="expiresIn" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {EXPIRY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="burnAfterRead">Burn after read</Label>
                  <p className="text-muted-foreground text-xs">
                    Delete the paste immediately after it is read once.
                  </p>
                </div>
                <Switch
                  id="burnAfterRead"
                  checked={burnAfterRead}
                  onCheckedChange={setBurnAfterRead}
                />
              </div>

              <Button type="submit" disabled={submitting} className="self-start">
                {submitting ? 'Creating…' : 'Create paste'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

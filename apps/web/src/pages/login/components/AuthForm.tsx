import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function AuthForm() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!username.trim() || !password || submitting)
      return

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
        toast.success(t('toast.loginSuccess'))
      }
      else {
        await register(username.trim(), password)
        toast.success(t('toast.registerSuccess'))
      }
      navigate('/mine')
    }
    catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t('error.authFailed'),
      )
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'login' ? t('login.title') : t('login.registerTitle')}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? t('login.description') : t('login.registerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">{t('field.username')}</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('placeholder.username')}
              autoComplete="username"
              maxLength={32}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-password">{t('field.password')}</Label>
            <Input
              id="account-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('placeholder.accountPassword')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              maxLength={128}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {mode === 'login'
              ? (submitting ? t('action.loggingIn') : t('action.login'))
              : t('action.register')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            nativeButton={false}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? t('action.switchToRegister') : t('action.switchToLogin')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

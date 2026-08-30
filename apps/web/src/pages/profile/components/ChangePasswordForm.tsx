import { useState } from 'react'
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
import { ApiError, changePassword } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

export function ChangePasswordForm() {
  const { t } = useI18n()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentPassword || !newPassword || submitting)
      return

    if (newPassword !== confirmPassword) {
      toast.error(t('error.passwordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('toast.passwordChanged'))
    }
    catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t('error.changePasswordFailed'),
      )
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.changePassword')}</CardTitle>
        <CardDescription>{t('profile.changePasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">{t('profile.currentPassword')}</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={128}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">{t('profile.newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('placeholder.accountPassword')}
              autoComplete="new-password"
              maxLength={128}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">{t('profile.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={128}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('action.saving') : t('action.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

import type { AdminUserItem } from '@psh/shared'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { ApiError, updateAdminUser } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

interface ResetPasswordDialogProps {
  user: AdminUserItem | null
  onClose: () => void
}

export function ResetPasswordDialog({ user, onClose }: ResetPasswordDialogProps) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !password || submitting)
      return

    setSubmitting(true)
    try {
      await updateAdminUser(user.id, { password })
      toast.success(t('toast.userUpdated'))
      setPassword('')
      onClose()
    }
    catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t('error.adminUpdateFailed'),
      )
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.users.dialog.resetTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.users.dialog.resetDescription', { username: user?.username ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-new-password">{t('admin.users.dialog.newPassword')}</Label>
            <Input
              id="admin-new-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('placeholder.accountPassword')}
              autoComplete="new-password"
              maxLength={128}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('action.saving') : t('action.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

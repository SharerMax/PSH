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
import { ApiError, deleteAdminUser } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

interface UserDeleteDialogProps {
  user: AdminUserItem | null
  onClose: () => void
}

export function UserDeleteDialog({ user, onClose }: UserDeleteDialogProps) {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    if (!user || deleting)
      return

    setDeleting(true)
    try {
      await deleteAdminUser(user.id)
      toast.success(t('toast.userDeleted'))
      onClose()
    }
    catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t('error.adminDeleteFailed'),
      )
    }
    finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.users.dialog.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.users.dialog.deleteDescription', { username: user?.username ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? t('action.deleting') : t('action.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

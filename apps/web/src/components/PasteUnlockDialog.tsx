import type { FormEvent } from 'react'
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
import { useI18n } from '@/lib/i18n'

interface PasteUnlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  password: string
  onPasswordChange: (value: string) => void
  error: boolean
  submitting: boolean
  onSubmit: () => void
}

export function PasteUnlockDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  error,
  submitting,
  onSubmit,
}: PasteUnlockDialogProps) {
  const { t } = useI18n()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('dialog.passwordTitle')}</DialogTitle>
          <DialogDescription>{t('dialog.passwordDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="paste-unlock-password">{t('dialog.passwordLabel')}</Label>
            <Input
              id="paste-unlock-password"
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              autoComplete="off"
            />
            {error && <p className="text-destructive text-sm">{t('error.wrongPassword')}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!password || submitting}>
              {submitting ? t('action.unlocking') : t('action.unlock')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import type { AdminUserItem } from '@psh/shared'
import { BanIcon, KeyRoundIcon, ShieldCheckIcon, Trash2Icon, UndoIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

function formatDate(iso: string, locale: 'en' | 'zh'): string {
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface UserTableProps {
  users: AdminUserItem[]
  currentUserId: string
  onResetPassword: (user: AdminUserItem) => void
  onDelete: (user: AdminUserItem) => void
  onToggleBan: (user: AdminUserItem) => void
}

export function UserTable({ users, currentUserId, onResetPassword, onDelete, onToggleBan }: UserTableProps) {
  const { t } = useI18n()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admin.users.col.username')}</TableHead>
          <TableHead>{t('admin.users.col.role')}</TableHead>
          <TableHead>{t('admin.users.col.pastes')}</TableHead>
          <TableHead>{t('admin.users.col.created')}</TableHead>
          <TableHead className="text-right">{t('admin.users.col.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <Row
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            onResetPassword={onResetPassword}
            onDelete={onDelete}
            onToggleBan={onToggleBan}
          />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({
  user,
  isSelf,
  onResetPassword,
  onDelete,
  onToggleBan,
}: {
  user: AdminUserItem
  isSelf: boolean
  onResetPassword: UserTableProps['onResetPassword']
  onDelete: UserTableProps['onDelete']
  onToggleBan: UserTableProps['onToggleBan']
}) {
  const { t, locale } = useI18n()

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {user.username}
          {user.banned && <Badge variant="destructive">{t('admin.users.banned')}</Badge>}
        </div>
      </TableCell>
      <TableCell>
        {user.role === 'admin'
          ? (
              <Badge variant="secondary">
                <ShieldCheckIcon className="size-3" />
                {t('admin.users.roleAdmin')}
              </Badge>
            )
          : <Badge variant="outline">{t('admin.users.roleUser')}</Badge>}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.pasteCount}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(user.createdAt, locale)}</TableCell>
      <TableCell className="text-right">
        <div className="inline-flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={t('admin.users.resetPassword')}
            title={t('admin.users.resetPassword')}
            onClick={() => onResetPassword(user)}
          >
            <KeyRoundIcon />
          </Button>
          {!isSelf && (
            <>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={user.banned ? t('admin.users.unban') : t('admin.users.ban')}
                title={user.banned ? t('admin.users.unban') : t('admin.users.ban')}
                onClick={() => onToggleBan(user)}
              >
                {user.banned ? <UndoIcon /> : <BanIcon />}
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                aria-label={t('action.delete')}
                title={t('action.delete')}
                disabled={user.role === 'admin'}
                onClick={() => onDelete(user)}
              >
                <Trash2Icon />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

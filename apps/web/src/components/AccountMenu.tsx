import { ClipboardListIcon, LogInIcon, LogOutIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  if (!user) {
    return (
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t('nav.login')}
        title={t('nav.login')}
        nativeButton={false}
        render={<Link to="/login" />}
      >
        <LogInIcon />
      </Button>
    )
  }

  async function handleLogout() {
    await logout()
    toast.success(t('toast.logoutSuccess'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={user.username}
            title={user.username}
          />
        )}
      >
        <Avatar size="sm">
          <AvatarFallback>{user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{user.username}</DropdownMenuLabel>
          <DropdownMenuItem render={<Link to="/mine" />}>
            <ClipboardListIcon data-icon="inline-start" />
            {t('nav.myPastes')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            {t('nav.logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { ClipboardListIcon, LogInIcon, LogOutIcon, Settings2Icon, StarIcon, UserRoundIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  if (!user) {
    return (
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t('nav.login')}
        title={t('nav.login')}
        nativeButton={false}
        render={(
          <Link
            to="/login"
            state={{ from: `${location.pathname}${location.search}` }}
          />
        )}
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
          <DropdownMenuItem render={<Link to="/mine/favorites" />}>
            <StarIcon data-icon="inline-start" />
            {t('nav.myFavorites')}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/profile" />}>
            <UserRoundIcon data-icon="inline-start" />
            {t('nav.profile')}
          </DropdownMenuItem>
          {user.role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link to="/admin/users" />}>
                <Settings2Icon data-icon="inline-start" />
                {t('nav.adminUsers')}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/admin/pastes" />}>
                <ClipboardListIcon data-icon="inline-start" />
                {t('nav.adminPastes')}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            {t('nav.logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

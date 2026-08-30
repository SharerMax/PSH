import { StarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError, favoritePaste, getFavoriteStatus, unfavoritePaste } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

interface FavoriteButtonProps {
  link: string
}

export function FavoriteButton({ link }: FavoriteButtonProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) {
      setFavorited(false)
      return
    }
    let cancelled = false
    getFavoriteStatus(link)
      .then((status) => {
        if (!cancelled)
          setFavorited(status.favorited)
      })
      .catch(() => {
        // leave the button in its default state
      })
    return () => {
      cancelled = true
    }
  }, [user, link])

  function goToLogin() {
    navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
  }

  function handleUnauthenticated() {
    // prompt first; navigating happens after the user confirms via the toast action
    toast(t('view.favoriteNeedLogin'), {
      action: { label: t('nav.login'), onClick: goToLogin },
    })
  }

  async function handleToggle() {
    if (!user) {
      handleUnauthenticated()
      return
    }
    if (busy)
      return
    setBusy(true)
    try {
      const next = favorited ? await unfavoritePaste(link) : await favoritePaste(link)
      setFavorited(next.favorited)
      toast.success(next.favorited ? t('toast.favorited') : t('toast.unfavorited'))
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthenticated()
      }
      else {
        toast.error(t('error.favoriteFailed'))
      }
    }
    finally {
      setBusy(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      aria-pressed={favorited}
      onClick={handleToggle}
    >
      <StarIcon data-icon="inline-start" className={favorited ? 'fill-current text-amber-500' : undefined} />
      {favorited ? t('action.unfavorite') : t('action.favorite')}
    </Button>
  )
}

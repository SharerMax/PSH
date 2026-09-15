import { createBrowserRouter } from 'react-router'
import { PasteView } from '@/pages/$link'
import { AdminPastes } from '@/pages/admin/pastes'
import { AdminStats } from '@/pages/admin/stats'
import { AdminUsers } from '@/pages/admin/users'
import { AdminViews } from '@/pages/admin/views'
import { Home } from '@/pages/home'
import { Login } from '@/pages/login'
import { MyPastes } from '@/pages/mine'
import { PasteManage } from '@/pages/mine/$id'
import { MyFavorites } from '@/pages/mine/favorites'
import { NotFound } from '@/pages/not-found'
import { Profile } from '@/pages/profile'
import { PasteStatsPage } from '@/pages/stats/$id'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/mine',
    element: <MyPastes />,
  },
  {
    path: '/mine/favorites',
    element: <MyFavorites />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/admin/users',
    element: <AdminUsers />,
  },
  {
    path: '/admin/pastes',
    element: <AdminPastes />,
  },
  {
    path: '/admin/stats',
    element: <AdminStats />,
  },
  {
    path: '/admin/views',
    element: <AdminViews />,
  },
  {
    path: '/mine/:id',
    element: <PasteManage />,
  },
  {
    path: '/stats/:id',
    element: <PasteStatsPage />,
  },
  {
    path: '/:link',
    element: <PasteView />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

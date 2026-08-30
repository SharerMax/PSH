import { createBrowserRouter } from 'react-router'
import { PasteView } from '@/pages/$link'
import { Home } from '@/pages/home'
import { Login } from '@/pages/login'
import { MyPastes } from '@/pages/mine'
import { PasteManage } from '@/pages/mine/$id'
import { PasteStatsPage } from '@/pages/mine/$id/stats'
import { MyFavorites } from '@/pages/mine/favorites'
import { NotFound } from '@/pages/not-found'

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
    path: '/mine/:id',
    element: <PasteManage />,
  },
  {
    path: '/mine/:id/stats',
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

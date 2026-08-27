import { createBrowserRouter } from 'react-router'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { MyPastes } from '@/pages/MyPastes'
import { NotFound } from '@/pages/NotFound'
import { PasteManage } from '@/pages/PasteManage'
import { PasteStatsPage } from '@/pages/PasteStats'
import { PasteView } from '@/pages/PasteView'

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
    path: '/mine/:id',
    element: <PasteManage />,
  },
  {
    path: '/mine/:id/stats',
    element: <PasteStatsPage />,
  },
  {
    path: '/:id',
    element: <PasteView />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

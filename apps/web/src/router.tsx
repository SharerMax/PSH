import { createBrowserRouter } from 'react-router'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { PasteView } from '@/pages/PasteView'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
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

import { AnimatePresence, MotionConfig } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Loader from './components/common/Loader'
import ScrollManager from './components/common/ScrollManager'
import { FavoritesProvider } from './context/FavoritesContext'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'

const MenuPage = lazy(() => import('./pages/MenuPage'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const location = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <FavoritesProvider>
        <Loader />
        <ScrollManager />
        <Suspense fallback={<div className="min-h-screen" />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </FavoritesProvider>
    </MotionConfig>
  )
}

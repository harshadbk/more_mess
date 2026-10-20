import { Lock } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import CursorGlow from '../components/common/CursorGlow'
import FloatingActions from '../components/common/FloatingActions'
import Footer from '../components/common/Footer'
import MobileTabBar from '../components/common/MobileTabBar'
import Navbar from '../components/common/Navbar'
import OfferBanner from '../components/common/OfferBanner'
import OrderBar from '../components/common/OrderBar'
import ScrollProgress from '../components/common/ScrollProgress'

export default function MainLayout() {
  return (
    <>
      <a href="#main" className="sr-only z-[100] rounded-full bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <ScrollProgress />
      <CursorGlow />
      <OfferBanner />
      <Navbar />
      <main id="main" className="relative">
        <Outlet />
      </main>
      {/* discreet admin entry, just above the footer */}
      <div className="container-x flex justify-center pt-10">
        <Link to="/admin" className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-ink/35 transition hover:bg-peach/60 hover:text-brand">
          <Lock size={11} /> Admin login
        </Link>
      </div>
      <Footer />
      <FloatingActions />
      <MobileTabBar />
      <OrderBar />
    </>
  )
}

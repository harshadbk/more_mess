import { motion } from 'framer-motion'
import { BadgePercent, House, Phone, UtensilsCrossed } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { useLocation } from 'react-router-dom'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useScrollTo } from '../../hooks/useScrollTo'
import { cn } from '../../utils/cn'
import { callLink, whatsappLink } from '../../utils/whatsapp'

const sectionIds = ['home', 'menu', 'special', 'why', 'offers', 'gallery', 'about', 'reviews', 'contact']
// Which tab lights up for each section
const tabFor = { home: 'home', menu: 'menu', special: 'menu', why: 'home', offers: 'offers', gallery: 'offers', about: 'offers', reviews: 'offers', contact: 'call' }

function Tab({ id, icon: Icon, label, onClick, href, active }) {
  const Tag = href ? 'a' : 'button'
  const isActive = active === id
  return (
    <Tag href={href} onClick={onClick} className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-bold" aria-current={isActive ? 'page' : undefined}>
      {isActive && <motion.span layoutId="tabbar-dot" className="absolute inset-x-3 inset-y-1 rounded-2xl bg-peach/80" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
      <Icon size={21} strokeWidth={isActive ? 2.5 : 2} className={cn('relative transition-colors', isActive ? 'text-brand' : 'text-ink/50')} />
      <span className={cn('relative', isActive ? 'text-brand' : 'text-ink/50')}>{label}</span>
    </Tag>
  )
}

/** App-style bottom navigation, mobile only. */
export default function MobileTabBar() {
  const { pathname } = useLocation()
  const scrollTo = useScrollTo()
  const section = useActiveSection(sectionIds, pathname === '/')
  const active = pathname === '/menu' ? 'menu' : tabFor[section] ?? 'home'

  return (
    <motion.nav
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 24 }}
      aria-label="Quick actions"
      className="fixed inset-x-3 z-50 sm:hidden"
      style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex h-[68px] items-stretch rounded-[1.75rem] border border-white/70 bg-white/90 px-1.5 shadow-[0_12px_40px_-8px_rgb(34_34_34/0.25)] backdrop-blur-xl">
        <Tab active={active} id="home" icon={House} label="Home" onClick={() => scrollTo('home')} />
        <Tab active={active} id="menu" icon={UtensilsCrossed} label="Menu" onClick={() => scrollTo('menu')} />
        <div className="relative flex w-[76px] shrink-0 justify-center">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order on WhatsApp"
            className="absolute -top-6 flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="relative grid h-[60px] w-[60px] place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_24px_-6px_rgb(255_107_0/0.8)] ring-[5px] ring-cream">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/30 [animation-duration:2.4s]" />
              <FaWhatsapp size={28} className="relative" />
            </span>
            <span className="text-[10.5px] font-extrabold text-brand">Order</span>
          </a>
        </div>
        <Tab active={active} id="offers" icon={BadgePercent} label="Offers" onClick={() => scrollTo('offers')} />
        <Tab active={active} id="call" icon={Phone} label="Call" href={callLink} />
      </div>
    </motion.nav>
  )
}

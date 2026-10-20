import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Phone, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { Link, useLocation } from 'react-router-dom'
import { navLinks, site } from '../../data/site'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useScrolled } from '../../hooks/useScrolled'
import { useScrollTo } from '../../hooks/useScrollTo'
import { cn } from '../../utils/cn'
import { callLink, whatsappLink } from '../../utils/whatsapp'
import Button from '../ui/Button'
import Logo from './Logo'

const ids = navLinks.map((l) => l.id)

export default function Navbar() {
  const scrolled = useScrolled(20)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const active = useActiveSection(ids, pathname === '/')
  const scrollTo = useScrollTo()

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open])

  const go = (id) => {
    setOpen(false)
    scrollTo(id)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 -mb-16 transition-all duration-500 sm:-mb-20',
          scrolled ? 'bg-white/85 shadow-[0_8px_30px_-12px_rgb(34_34_34/0.15)] backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <nav className="container-x flex h-16 items-center sm:h-20 justify-between gap-4" aria-label="Main">
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === '/' ? active === link.id : pathname === '/menu' && link.id === 'menu'
              return (
                <li key={link.id}>
                  <a
                    href={`/#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      go(link.id)
                    }}
                    className={cn('group relative px-3.5 py-2 text-[15px] font-semibold transition-colors', isActive ? 'text-brand' : 'text-ink/75 hover:text-ink')}
                  >
                    {link.label}
                    <span
                      className={cn(
                        'absolute inset-x-3.5 -bottom-0.5 h-[3px] origin-left rounded-full bg-gradient-to-r from-brand to-cheese transition-transform duration-300',
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      )}
                    />
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="hidden h-11 w-11 place-items-center rounded-full bg-[#25D366]/10 text-[#25D366] transition hover:scale-110 hover:bg-[#25D366] hover:text-white sm:grid"
            >
              <FaWhatsapp size={22} />
            </a>
            <span className="hidden sm:block">
              <Button as={Link} to="/menu" size="sm">
                Order Now
              </Button>
            </span>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-soft transition hover:text-brand lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="glass absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col overflow-y-auto rounded-l-[2rem] bg-white/85 p-6 shadow-lift"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-2xl bg-mist transition hover:rotate-90">
                  <X size={22} />
                </button>
              </div>

              <motion.ul className="mt-10 space-y-1" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}>
                {navLinks.map((link, i) => (
                  <motion.li key={link.id} variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0 } }}>
                    <button
                      onClick={() => go(link.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-4 py-3.5 font-display text-2xl font-bold transition',
                        active === link.id && pathname === '/' ? 'bg-peach/70 text-brand' : 'hover:bg-mist',
                      )}
                    >
                      {link.label}
                      <span className="text-sm font-semibold text-ink/30">0{i + 1}</span>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-auto space-y-3 pt-8">
                <Button as={Link} to="/menu" onClick={() => setOpen(false)} size="lg" className="w-full">
                  <ShoppingBag size={20} /> Order Now
                </Button>
                <Button href={callLink} variant="outline" size="lg" className="w-full">
                  <Phone size={18} /> {site.phoneDisplay}
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

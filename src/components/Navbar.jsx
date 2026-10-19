import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, UserRound, X } from 'lucide-react'
import Logo from './Logo.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { messages } from '../utils/whatsapp.js'
import { homeFor, useAuth } from '../context/AuthContext.jsx'

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'menu', label: 'Menu' },
  { id: 'meal-plans', label: 'Meal Plans' },
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'order-today', label: 'Order Today' },
  { id: 'contact', label: 'Contact' },
]

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

const sectionIds = navLinks.map((l) => l.id)

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(sectionIds)
  const { user } = useAuth()
  const account = user
    ? { to: homeFor(user), label: user.role === 'admin' ? 'Admin' : 'My groups' }
    : { to: '/login', label: 'Log in' }
  const toggleRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on Escape, lock page scroll and move focus while the mobile menu is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => window.innerWidth >= 1024 && setOpen(false)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('a')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = ''
    }
  }, [open])

  const linkClass = (id) =>
    `relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${
      active === id ? 'text-forest' : 'text-charcoal/75 hover:text-forest'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? 'border-b border-line bg-cream/95 shadow-[0_6px_24px_-18px_rgb(23_77_53/0.5)] backdrop-blur-md'
          : 'border-b border-transparent bg-cream'
      }`}
    >
      <nav className="container-page flex h-[4.5rem] items-center justify-between gap-4" aria-label="Main">
        <a href="#home" className="shrink-0 rounded-lg" aria-label="Sai Mess — back to top">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={linkClass(link.id)}
                aria-current={active === link.id ? 'true' : undefined}
              >
                {link.label}
                {active === link.id && (
                  <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-saffron" aria-hidden="true" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link to={account.to} className="btn-outline hidden min-h-11 px-4 text-sm sm:inline-flex">
            <UserRound className="size-4" aria-hidden="true" />
            {account.label}
          </Link>
          <WhatsAppButton
            signUp="Join Sai Mess"
            message={messages.join()}
            className="btn-primary hidden min-h-11 px-5 text-sm sm:inline-flex"
          >
            Join Sai Mess
          </WhatsAppButton>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-forest lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-cream lg:hidden"
      >
        <ul className="container-page flex flex-col py-4">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between border-b border-line/70 py-4 font-display text-xl font-bold ${
                  active === link.id ? 'text-forest' : 'text-charcoal'
                }`}
              >
                {link.label}
                {active === link.id && <span className="size-2 rounded-full bg-saffron" aria-hidden="true" />}
              </a>
            </li>
          ))}
        </ul>
        <div className="container-page flex flex-col gap-3 pb-8">
          <Link to={account.to} className="btn-outline w-full" onClick={() => setOpen(false)}>
            <UserRound className="size-4" aria-hidden="true" />
            {account.label}
          </Link>
          <WhatsAppButton
            signUp="Join Sai Mess"
            message={messages.join()}
            className="btn-primary w-full"
            onClick={() => setOpen(false)}
          >
            Join Sai Mess
          </WhatsAppButton>
        </div>
      </div>
    </header>
  )
}

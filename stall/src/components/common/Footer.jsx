import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { navLinks, site } from '../../data/site'
import { useScrollTo } from '../../hooks/useScrollTo'
import { callLink, whatsappLink } from '../../utils/whatsapp'
import Logo from './Logo'

const socials = [
  { href: site.social.instagram, icon: FaInstagram, label: 'Instagram' },
  { href: site.social.facebook, icon: FaFacebookF, label: 'Facebook' },
  { href: site.social.youtube, icon: FaYoutube, label: 'YouTube' },
  { href: whatsappLink(), icon: FaWhatsapp, label: 'WhatsApp' },
]

export default function Footer() {
  const scrollTo = useScrollTo()

  return (
    <footer className="relative mt-24 bg-gradient-to-b from-peach/60 to-peach">
      <svg className="absolute -top-[59px] left-0 h-[60px] w-full text-peach/60" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0,32 C240,72 480,0 720,24 C960,48 1200,8 1440,30 L1440,60 L0,60 Z" />
      </svg>

      <div className="container-x relative grid gap-12 pb-10 pt-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs leading-relaxed text-ink/60">{site.subheading}</p>
          <div className="mt-6 flex gap-3">
            {socials.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-soft transition duration-300 hover:-translate-y-1 hover:bg-brand hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold">Quick Links</h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-1">
            {navLinks.map((l) => (
              <li key={l.id}>
                <button onClick={() => scrollTo(l.id)} className="text-ink/60 transition hover:translate-x-1 hover:text-brand">
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold">Contact</h3>
          <ul className="mt-5 space-y-4 text-ink/70">
            <li>
              <a href={callLink} className="flex items-start gap-3 transition hover:text-brand">
                <Phone size={18} className="mt-0.5 shrink-0 text-brand" /> {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-start gap-3 transition hover:text-brand">
                <Mail size={18} className="mt-0.5 shrink-0 text-brand" /> {site.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand" /> {site.address}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold">Business Hours</h3>
          <ul className="mt-5 space-y-3">
            {site.hours.map((h) => (
              <li key={h.day} className="flex items-start gap-3 text-ink/70">
                <Clock size={18} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <span className="block font-semibold text-ink">{h.day}</span>
                  {h.time}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 pb-28 pt-6 text-center text-sm text-ink/50 sm:flex-row sm:py-6 sm:text-left">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Made fresh with ❤️ — 100% Pure Veg</p>
        </div>
      </div>
    </footer>
  )
}

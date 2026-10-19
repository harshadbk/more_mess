import { Camera, ExternalLink, Globe, MapPin, MessageCircle, Phone } from 'lucide-react'
import Logo from './Logo.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { navLinks } from './Navbar.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { mealPlans } from '../data/mealPlans.js'
import { messages } from '../utils/whatsapp.js'
import {
  formatIndianNumber,
  fullAddress,
  hasPhone,
  hasWhatsApp,
  phoneDigits,
  phoneHref,
  socialLinks,
  whatsappDigits,
} from '../utils/business.js'

const socialIcon = { instagram: Camera, facebook: Globe, googleBusiness: MapPin }
const year = new Date().getFullYear()

const linkClass = 'text-white/70 transition-colors hover:text-saffron'

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-white">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-10">
        <div>
          <a href="#home" className="inline-block rounded-lg" aria-label="Sai Mess — back to top">
            <Logo light />
          </a>
          <p className="mt-5 max-w-xs leading-relaxed text-white/70">{businessConfig.tagline}</p>
          {socialLinks.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((s) => {
                const Icon = socialIcon[s.id] ?? ExternalLink
                return (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-sm text-white/80 transition-colors hover:border-saffron hover:text-saffron"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {s.label}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-sm font-bold tracking-widest text-saffron uppercase">Explore</h2>
          <ul className="mt-5 space-y-3 text-[15px]">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className={linkClass}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-bold tracking-widest text-saffron uppercase">Meals</h2>
          <ul className="mt-5 space-y-3 text-[15px]">
            <li>
              <a href="#menu" className={linkClass}>
                Menu
              </a>
            </li>
            {mealPlans.map((p) => (
              <li key={p.id}>
                <a href="#meal-plans" className={linkClass}>
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold tracking-widest text-saffron uppercase">Get in touch</h2>
          {(fullAddress || hasPhone || hasWhatsApp) && (
            <ul className="mt-5 space-y-4 text-[15px] text-white/70">
              {fullAddress && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-[18px] shrink-0 text-saffron" aria-hidden="true" />
                  {fullAddress}
                </li>
              )}
              {hasPhone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-[18px] shrink-0 text-saffron" aria-hidden="true" />
                  <a href={phoneHref} className={linkClass}>
                    {formatIndianNumber(phoneDigits)}
                  </a>
                </li>
              )}
              {hasWhatsApp && (
                <li className="flex gap-3">
                  <MessageCircle className="mt-0.5 size-[18px] shrink-0 text-saffron" aria-hidden="true" />
                  <WhatsAppButton icon={false} className={linkClass} message={messages.general()}>
                    WhatsApp {formatIndianNumber(whatsappDigits)}
                  </WhatsAppButton>
                </li>
              )}
            </ul>
          )}
          <WhatsAppButton
            signUp="Join Sai Mess"
            message={messages.join()}
            className="btn-saffron mt-6 min-h-11 text-sm"
          >
            Join Sai Mess
          </WhatsAppButton>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {businessConfig.name}. All rights reserved.
          </p>
          <p className="max-w-xl md:text-right">
            Privacy: this website does not store form submissions on a server. Enquiries are sent only through WhatsApp
            when you choose to send them.
          </p>
        </div>
      </div>
    </footer>
  )
}

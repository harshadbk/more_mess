import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Heart, Mail, MessageCircle, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaInstagram } from 'react-icons/fa6'
import { fadeUp, stagger } from '../../animations/variants'
import { faqs, instagram } from '../../data/content'
import { site } from '../../data/site'
import { subscribeNewsletter } from '../../services/contactService'
import { cn } from '../../utils/cn'
import { callLink } from '../../utils/whatsapp'
import Button from '../ui/Button'
import SectionHeading from '../ui/SectionHeading'
import SmartImage from '../ui/SmartImage'

export function InstagramFeed() {
  return (
    <section aria-labelledby="insta-title" className="py-20">
      <div className="container-x">
        <div className="mb-10 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <span className="eyebrow">
              <FaInstagram /> @shreesaisnacks
            </span>
            <h2 id="insta-title" className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Follow the <span className="text-gradient">crunch</span>
            </h2>
          </div>
          <Button href={site.social.instagram} target="_blank" rel="noopener noreferrer" variant="outline">
            <FaInstagram size={18} /> Follow us
          </Button>
        </div>
        <motion.div variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {instagram.map((id, i) => (
            <motion.a key={id} variants={fadeUp} href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl" aria-label="View on Instagram">
              <SmartImage id={id} alt="" width={320} sizes="(min-width:768px) 16vw, 33vw" className="h-full w-full" imgClassName="group-hover:scale-110" />
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-brand/70 text-sm font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex items-center gap-1">
                  <Heart size={16} className="fill-white" /> {120 + i * 37}
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <MessageCircle size={16} /> {8 + i * 3}
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="py-14 sm:py-24 lg:py-28">
      <div className="container-x max-w-3xl">
        <SectionHeading eyebrow="❓ FAQ" title="Got" highlight="questions?" />
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={cn('overflow-hidden rounded-3xl bg-white shadow-soft transition', isOpen && 'ring-2 ring-brand/20')}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 p-6 text-left">
                  <span className="font-display text-lg font-bold">{f.q}</span>
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300', isOpen ? 'rotate-180 bg-brand text-white' : 'bg-mist')}>
                    <ChevronDown size={18} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p className="px-6 pb-6 leading-relaxed text-ink/60">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const submit = async (e) => {
    e.preventDefault()
    setState('loading')
    await subscribeNewsletter(email)
    setState('done')
    setEmail('')
  }
  return (
    <section aria-labelledby="news-title" className="py-12">
      <div className="container-x">
        <div className="neu relative overflow-hidden px-6 py-12 text-center sm:px-12">
          <div className="grain absolute inset-0 opacity-50" />
          <div className="relative">
            <span className="text-5xl">💌</span>
            <h2 id="news-title" className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Get <span className="text-gradient">secret offers</span> first
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink/60">New items, festival deals and student-only coupons. No spam, just snacks.</p>
            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Email address</span>
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-14 w-full rounded-full bg-white pl-11 pr-4 shadow-sm outline-none ring-brand/30 transition focus:ring-4" />
              </label>
              <Button type="submit" size="lg" disabled={state === 'loading'}>
                {state === 'loading' ? 'Joining…' : 'Subscribe'}
              </Button>
            </form>
            {state === 'done' && (
              <p role="status" className="mt-4 text-sm font-semibold text-emerald-600">
                🎉 You’re in! Watch your inbox for tasty surprises.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function OrderCta() {
  const { pathname } = useLocation()

  return (
    <section aria-labelledby="cta-title" className="py-16">
      <div className="container-x">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-center text-white sm:px-12 lg:py-20">
          <div className="absolute -left-20 -top-20 -z-10 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full bg-cheese/30 blur-3xl" />
          {['🥪', '🍔', '🍟', '☕', '🧀'].map((e, i) => (
            <motion.span
              key={e}
              aria-hidden="true"
              animate={{ y: [0, -18, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -z-10 text-5xl opacity-80 sm:text-6xl"
              style={{ left: `${[6, 84, 14, 76, 48][i]}%`, top: `${[18, 20, 70, 68, 6][i]}%` }}
            >
              {e}
            </motion.span>
          ))}
          <h2 id="cta-title" className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Your next favourite bite is <span className="text-gradient">one tap away.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-white/70">Pick from the menu, send your order on WhatsApp and pick it up hot and fresh. No waiting, no fuss.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {/* Already on the menu page: take them back up to the dishes instead. */}
            <Button
              as={Link}
              to="/menu"
              onClick={() => pathname === '/menu' && window.scrollTo({ top: 0, behavior: 'smooth' })}
              size="lg"
              variant="whatsapp"
            >
              <ShoppingBag size={20} /> Order Now
            </Button>
            <Button href={callLink} size="lg">
              Call {site.phoneDisplay}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

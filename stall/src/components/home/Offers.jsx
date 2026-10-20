import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Check, Copy, Ticket } from 'lucide-react'
import { useState } from 'react'
import { fadeUp, stagger } from '../../animations/variants'
import { offers } from '../../data/content'
import { cn } from '../../utils/cn'
import { whatsappLink } from '../../utils/whatsapp'
import Button from '../ui/Button'
import SectionHeading from '../ui/SectionHeading'

const burst = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
    colors: ['#FF6B00', '#FF8A00', '#FFC93C', '#2ECC71', '#FFE7CC'],
    disableForReducedMotion: true,
  })
}

const floatingCoupons = [
  { t: '-20%', cls: 'left-[4%] top-[12%] rotate-[-12deg]', d: 0 },
  { t: '₹30 🧀', cls: 'right-[6%] top-[8%] rotate-[10deg]', d: 1 },
  { t: 'FREE 🍟', cls: 'left-[8%] bottom-[10%] rotate-[8deg]', d: 2 },
  { t: 'COMBO', cls: 'right-[4%] bottom-[16%] rotate-[-8deg]', d: 1.5 },
]

function Coupon({ offer }) {
  const [copied, setCopied] = useState(false)
  const claim = async (e) => {
    burst(e)
    try {
      await navigator.clipboard.writeText(offer.code)
    } catch {
      /* clipboard blocked: the code is still visible */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <motion.article variants={fadeUp} className="group relative flex w-[86vw] max-w-md shrink-0 snap-center overflow-hidden rounded-[2rem] bg-white shadow-soft lg:w-auto lg:max-w-none transition duration-500 hover:-translate-y-2 hover:shadow-lift">
      <div className={cn('relative flex w-28 shrink-0 flex-col items-center justify-center bg-gradient-to-b text-white sm:w-32', offer.tint)}>
        <span className="text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{offer.emoji}</span>
        {/* perforation */}
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cream" />
        <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-cream" />
      </div>
      <div className="flex flex-1 flex-col border-l-2 border-dashed border-ink/10 p-6">
        <h3 className="text-xl font-bold">{offer.title}</h3>
        <p className="mt-1 text-sm text-ink/60">{offer.text}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold text-brand">{offer.price}</span>
          <span className="text-sm text-ink/40 line-through">{offer.was}</span>
        </div>
        <button onClick={claim} className="mt-4 flex w-fit items-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-peach/40 px-3 py-2 font-mono text-sm font-bold text-brand transition hover:border-brand hover:bg-peach">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied! Show at counter' : offer.code}
        </button>
      </div>
    </motion.article>
  )
}

export default function Offers() {
  return (
    <section id="offers" className="relative overflow-hidden py-14 sm:py-24 lg:py-32">
      {floatingCoupons.map((c) => (
        <motion.span
          key={c.t}
          aria-hidden="true"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: c.d, ease: 'easeInOut' }}
          className={cn('glass pointer-events-none absolute hidden rounded-2xl border-2 border-dashed border-brand/30 px-4 py-2 font-display text-lg font-extrabold text-brand shadow-soft 2xl:block', c.cls)}
        >
          {c.t}
        </motion.span>
      ))}

      <div className="container-x">
        {/* Student combo hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-2 to-cheese bg-[length:200%_200%] p-7 sm:rounded-[2.5rem] sm:p-8 text-white shadow-lift animate-gradient sm:p-12 lg:p-16"
        >
          <div className="absolute -right-20 -top-20 -z-10 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-tomato/30 blur-3xl" />
          <div className="absolute -bottom-3 -right-3 -z-10 select-none text-[5.5rem] leading-none opacity-80 drop-shadow-2xl sm:text-[8rem] lg:bottom-auto lg:right-8 lg:top-1/2 lg:-translate-y-1/2 lg:text-[11rem] lg:opacity-90" aria-hidden="true">
            🥪☕
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur">
            <Ticket size={14} /> Student combo
          </span>
          <h2 className="mt-5 max-w-xl text-[2rem] font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Grill Sandwich + Cold Coffee for just ₹149
          </h2>
          <p className="mt-4 max-w-md text-white/85">Show your college ID at the counter. Valid every day, all day: fuel for lectures, late-night study and everything in between.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="dark"
              size="lg"
              onClick={burst}
              href={whatsappLink('Hi! I want the Student Combo 🎓 (Grill Sandwich + Cold Coffee for ₹149)')}
              target="_blank"
              rel="noopener noreferrer"
            >
              🎉 Claim Offer
            </Button>
          </div>
        </motion.div>

        <div className="mt-14 sm:mt-20">
          <SectionHeading eyebrow="🎁 Offers" title="Deals worth" highlight="celebrating." text="Tap a coupon to copy the code and show it at the counter." />
          <motion.div variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
            {offers.map((o) => (
              <Coupon key={o.code} offer={o} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ArrowRight, Star } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { word } from '../../animations/variants'
import { photos } from '../../data/photos'
import { site } from '../../data/site'
import { useScrollTo } from '../../hooks/useScrollTo'
import { imageUrl } from '../../utils/images'
import { whatsappLink } from '../../utils/whatsapp'
import Button from '../ui/Button'
import { Bread, Cheese, CoffeeBean, Leaf, Lettuce, Onion, Tomato } from './Ingredients'

const lines = [
  [{ t: 'Fresh', hl: true }, { t: 'Sandwiches' }],
  [{ t: 'Juicy', hl: true }, { t: 'Burgers' }],
  [{ t: 'Crispy', hl: true }, { t: 'Toasts' }],
  [{ t: 'Hot', hl: true }, { t: 'Coffee' }],
]

const satellites = [
  { id: photos.burgerClassic, label: 'Juicy Burger', price: 60, pos: 'left-[-2%] top-[6%]', size: 'w-[30%]' },
  { id: photos.friesBasket, label: 'Peri Peri Fries', price: 90, pos: 'right-[-1%] top-[2%]', size: 'w-[26%]' },
  { id: photos.icedCoffee, label: 'Cold Coffee', price: 60, pos: 'right-[-4%] bottom-[12%]', size: 'w-[28%]' },
  { id: photos.cheeseToastBlue, label: 'Cheese Toast', price: 70, pos: 'left-[2%] bottom-[2%]', size: 'w-[25%]' },
]

const ingredients = [
  { C: Cheese, cls: 'left-[18%] top-[-4%] w-14', depth: 40 },
  { C: Tomato, cls: 'right-[22%] top-[-6%] w-12', depth: 55 },
  { C: Lettuce, cls: 'left-[-6%] top-[44%] w-14', depth: 30 },
  { C: Bread, cls: 'right-[-7%] top-[38%] w-12', depth: 45 },
  { C: CoffeeBean, cls: 'right-[30%] bottom-[-4%] w-8', depth: 60 },
  { C: CoffeeBean, cls: 'left-[34%] bottom-[-6%] w-6', depth: 35 },
  { C: Leaf, cls: 'left-[42%] top-[-9%] w-9', depth: 50 },
  { C: Onion, cls: 'left-[-2%] bottom-[30%] w-9', depth: 65 },
  { C: Leaf, cls: 'right-[4%] bottom-[-8%] w-10', depth: 25 },
]

const particles = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  size: 4 + ((i * 7) % 8),
  color: ['#FF6B00', '#FFC93C', '#2ECC71', '#FF8A00'][i % 4],
}))

function useParallax(mx, my, depth) {
  const x = useTransform(mx, (v) => v * depth)
  const y = useTransform(my, (v) => v * depth)
  return { x, y }
}

function ParallaxLayer({ mx, my, depth, className, children }) {
  const style = useParallax(mx, my, depth)
  return (
    <motion.div style={style} className={className}>
      {children}
    </motion.div>
  )
}

export default function Hero() {
  const root = useRef(null)
  const scrollTo = useScrollTo()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 })
  const my = useSpring(rawY, { stiffness: 60, damping: 18 })

  const onMove = (e) => {
    const r = root.current.getBoundingClientRect()
    rawX.set((e.clientX - r.left) / r.width - 0.5)
    rawY.set((e.clientY - r.top) / r.height - 0.5)
  }

  // GSAP: slow plate rotation, floating ingredients, drifting particles & blobs.
  useEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('.hero-plate', { rotation: 360, duration: 90, repeat: -1, ease: 'none' })
        gsap.to('.hero-badge-ring', { rotation: -360, duration: 22, repeat: -1, ease: 'none' })
        gsap.utils.toArray('.hero-float').forEach((el, i) => {
          gsap.to(el, {
            y: gsap.utils.random(-22, 22),
            x: gsap.utils.random(-12, 12),
            rotation: gsap.utils.random(-25, 25),
            duration: gsap.utils.random(3, 5.5),
            delay: i * 0.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        })
        gsap.utils.toArray('.hero-sat').forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 14 : -14, duration: 3.2 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        })
        gsap.utils.toArray('.hero-particle').forEach((el) => {
          gsap.to(el, {
            y: gsap.utils.random(-60, 60),
            x: gsap.utils.random(-40, 40),
            opacity: gsap.utils.random(0.2, 0.8),
            duration: gsap.utils.random(4, 9),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        })
        gsap.to('.hero-blob', { scale: 1.15, x: 30, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 1.5 })
      })
    }, root)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [])

  return (
    <section id="home" ref={root} onPointerMove={onMove} className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-10 pt-24 sm:pb-16 sm:pt-28 lg:pt-24">
      {/* ---------- Background ---------- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#FFE7CC_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,#FFF1DE_0%,transparent_50%)]" />
        <div className="grain absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <ParallaxLayer mx={mx} my={my} depth={-30} className="absolute inset-0">
          <div className="hero-blob absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-brand-2/25 blur-[90px]" />
          <div className="hero-blob absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-cheese/25 blur-[90px]" />
          <div className="hero-blob absolute left-1/3 top-1/4 h-[260px] w-[260px] rounded-full bg-leaf/10 blur-[80px]" />
        </ParallaxLayer>
        <ParallaxLayer mx={mx} my={my} depth={20} className="absolute inset-0">
          <div className="absolute left-[6%] top-[22%] h-24 w-24 rounded-full border-2 border-dashed border-brand/20" />
          <div className="absolute bottom-[14%] left-[46%] h-16 w-16 rounded-full bg-peach/80" />
          <div className="absolute right-[8%] top-[16%] h-10 w-10 rounded-full border-4 border-cheese/40" />
          {particles.map((p, i) => (
            <span key={i} className="hero-particle absolute rounded-full opacity-40" style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color }} />
          ))}
        </ParallaxLayer>
      </div>

      <div className="container-x grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* ---------- Copy ---------- */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 shadow-soft">
            <span className="flex items-center gap-1.5 rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
              </span>
              Open now
            </span>
            <span className="text-sm font-semibold text-ink/70">{site.tagline}</span>
          </motion.div>

          <motion.h1
            className="mt-6 font-display text-[clamp(2.3rem,11.2vw,3.75rem)] font-extrabold sm:mt-7 leading-[0.98] tracking-[-0.035em] sm:text-6xl xl:text-[4.6rem] 2xl:text-[5.2rem]"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } } }}
          >
            {lines.map((line, li) => (
              <span key={li} className="block whitespace-nowrap">
                {line.map((w) => (
                  <span key={w.t} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <motion.span variants={word} className={`inline-block ${w.hl ? 'text-gradient' : ''}`}>
                      {w.t}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
            <span className="relative mt-2 block text-[0.62em] font-bold tracking-[-0.02em] text-ink/85">
              <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <motion.span variants={word} className="inline-block">
                  All in{' '}
                  <span className="relative inline-block">
                    One Place.
                    <svg className="absolute -bottom-2 left-0 w-full text-brand" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                      <motion.path
                        d="M3 9 C50 2 150 2 197 7"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.4, duration: 0.9, ease: 'easeInOut' }}
                      />
                    </svg>
                  </span>
                </motion.span>
              </span>
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }} className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink/60 sm:mt-7 sm:text-lg lg:mx-0">
            <span className="font-semibold text-ink">Serving happiness one bite at a time.</span> {site.subheading}
          </motion.p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:flex sm:justify-center lg:justify-start">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3, type: 'spring', stiffness: 120 }}>
              <Button size="lg" className="w-full px-4 sm:w-auto sm:px-8" onClick={() => scrollTo('menu')}>
                <span className="sm:hidden">Menu</span>
                <span className="hidden sm:inline">Explore Menu</span> <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.45, type: 'spring', stiffness: 120 }}>
              <Button size="lg" variant="outline" className="w-full px-4 sm:w-auto sm:px-8" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp size={20} className="text-[#25D366]" /> <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Order on WhatsApp</span>
              </Button>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="mt-7 flex items-center justify-center gap-4 sm:mt-10 lg:justify-start">
            <div className="flex -space-x-3">
              {['A', 'S', 'R', 'P'].map((l, i) => (
                <span key={l} className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-cream font-display text-sm font-bold text-white" style={{ background: ['#FF6B00', '#2ECC71', '#FF8A00', '#222'][i] }}>
                  {l}
                </span>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 font-bold">
                <Star size={16} className="fill-cheese text-cheese" /> 4.9 <span className="font-medium text-ink/50">rating</span>
              </div>
              <p className="text-sm text-ink/55">5000+ happy foodies</p>
            </div>
          </motion.div>
        </div>

        {/* ---------- Food composition ---------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[min(82vw,600px)]"
        >
          <ParallaxLayer mx={mx} my={my} depth={-18} className="absolute inset-0">
            {/* glow + rings */}
            <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-brand-2/40 via-cheese/30 to-transparent blur-3xl" />
            <div className="absolute inset-[4%] rounded-full border border-brand/10" />
            <div className="absolute inset-[-2%] rounded-full border border-dashed border-brand/15" />
            {/* plate */}
            <div className="absolute inset-[13%] rounded-full bg-white p-[3.5%] shadow-[0_40px_80px_-30px_rgb(255_107_0/0.55),inset_0_-8px_20px_rgb(255_231_204/0.8)]">
              <div className="hero-plate h-full w-full overflow-hidden rounded-full">
                <img
                  src={imageUrl(photos.grillTriangles, 720)}
                  srcSet={`${imageUrl(photos.grillTriangles, 420)} 420w, ${imageUrl(photos.grillTriangles, 720)} 720w, ${imageUrl(photos.grillTriangles, 960)} 960w`}
                  sizes="(min-width: 1024px) 420px, 70vw"
                  alt="Golden grilled veg cheese sandwich"
                  width="720"
                  height="720"
                  fetchPriority="high"
                  className="h-full w-full scale-110 object-cover"
                />
              </div>
            </div>
          </ParallaxLayer>

          {/* satellite dishes */}
          {satellites.map((s, i) => (
            <ParallaxLayer key={s.label} mx={mx} my={my} depth={24 + i * 8} className={`absolute ${s.pos} ${s.size}`}>
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 + i * 0.15, type: 'spring', stiffness: 180, damping: 14 }} className="group relative">
                <div className="hero-sat">
                <div className="aspect-square overflow-hidden rounded-full border-[5px] border-white shadow-lift transition-transform duration-500 group-hover:scale-110">
                  <img src={imageUrl(s.id, 260)} alt={s.label} width="260" height="260" className="h-full w-full object-cover" />
                </div>
                <div className="glass absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold shadow-soft sm:text-xs">
                  {s.label} <span className="text-brand">₹{s.price}</span>
                </div>
                </div>
              </motion.div>
            </ParallaxLayer>
          ))}

          {/* rotating badge */}
          <ParallaxLayer mx={mx} my={my} depth={50} className="absolute left-[34%] top-[-3%] hidden w-[21%] sm:block">
            <div className="relative aspect-square rounded-full bg-ink text-white shadow-lift">
              <svg viewBox="0 0 100 100" className="hero-badge-ring absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                  <path id="badgeCircle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
                </defs>
                <text fontSize="9.5" fontWeight="700" letterSpacing="2.4" fill="#FFC93C">
                  <textPath href="#badgeCircle">100% PURE VEG • MADE FRESH • </textPath>
                </text>
              </svg>
              <span className="absolute inset-0 grid place-items-center text-2xl">🥪</span>
            </div>
          </ParallaxLayer>

          {/* floating ingredients */}
          {ingredients.map(({ C, cls, depth }, i) => (
            <ParallaxLayer key={i} mx={mx} my={my} depth={depth} className={`pointer-events-none absolute ${cls}`}>
              <C className="hero-float h-auto w-full drop-shadow-[0_10px_14px_rgb(34_34_34/0.18)]" aria-hidden="true" />
            </ParallaxLayer>
          ))}
        </motion.div>
      </div>

      {/* scroll cue */}
      <button onClick={() => scrollTo('why')} aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink/40 lg:flex">
        Scroll
        <span className="flex h-10 w-6 justify-center rounded-full border-2 border-ink/20 pt-2">
          <motion.span animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="h-2 w-1 rounded-full bg-brand" />
        </span>
      </button>
    </section>
  )
}

import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeartHandshake, Leaf, Wallet } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { fadeUp, slideLeft, slideRight, stagger } from '../../animations/variants'
import { timeline } from '../../data/content'
import { photos } from '../../data/photos'
import SectionHeading from '../ui/SectionHeading'
import SmartImage from '../ui/SmartImage'

gsap.registerPlugin(ScrollTrigger)

const values = [
  { icon: Leaf, title: 'Fresh Ingredients', text: 'Sourced every morning from local vendors.' },
  { icon: Wallet, title: 'Affordable Prices', text: 'Café quality at street-stall prices.' },
  { icon: HeartHandshake, title: 'Customer Satisfaction', text: 'If you don’t love it, we make it again.' },
]

export default function About() {
  const root = useRef(null)

  // GSAP parallax on the collage images + timeline line draw.
  useEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('[data-speed]').forEach((el) => {
          gsap.to(el, { yPercent: Number(el.dataset.speed) * -20, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
        })
        gsap.fromTo('.timeline-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: true } })
      })
    }, root)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [])

  return (
    <section id="about" ref={root} className="relative overflow-hidden py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* collage */}
          <motion.div variants={slideLeft} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative mx-auto grid w-full max-w-xl grid-cols-2 gap-4">
            <div data-speed="1" className="space-y-4 pt-12">
              <SmartImage id={photos.chefFlame} alt="Our kitchen in action" ratio={1.25} width={480} sizes="(min-width:1024px) 22vw, 45vw" className="rounded-[2rem] shadow-lift" />
              <SmartImage id={photos.coffeeCheers} alt="Customers sharing coffee" ratio={0.8} width={480} sizes="(min-width:1024px) 22vw, 45vw" className="rounded-[2rem] shadow-soft" />
            </div>
            <div data-speed="-0.6" className="space-y-4">
              <SmartImage id={photos.cafeBright} alt="Our bright, welcoming stall" ratio={0.85} width={480} sizes="(min-width:1024px) 22vw, 45vw" className="rounded-[2rem] shadow-soft" />
              <SmartImage id={photos.grilledCheese} alt="Freshly grilled cheese sandwich" ratio={1.2} width={480} sizes="(min-width:1024px) 22vw, 45vw" className="rounded-[2rem] shadow-lift" />
            </div>
            <div className="glass absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl px-5 py-3 shadow-lift">
              <span className="font-display text-4xl font-black text-gradient">5+</span>
              <span className="text-sm font-semibold leading-tight text-ink/70">
                years of
                <br />
                serving happiness
              </span>
            </div>
          </motion.div>

          {/* story */}
          <motion.div variants={slideRight} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <SectionHeading align="left" className="mb-8 md:mb-8" eyebrow="Our story" title="From one small grill to" highlight="everyone's favourite." />
            <p className="text-lg leading-relaxed text-ink/65">
              Shree Sai Snacks &amp; Sandwich began with a simple idea: <strong className="text-ink">fresh, honest food that anyone can afford</strong>. No frozen shortcuts, no compromises. Just crisp vegetables, quality cheese, soft bread and a lot of love on a hot grill.
            </p>
            <p className="mt-4 leading-relaxed text-ink/65">
              <strong className="text-ink">Our mission</strong> is to be the happiest stop in your day, whether that’s a quick bite between lectures, a family evening snack or a team lunch.
            </p>
            <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-8 grid gap-4 sm:grid-cols-3">
              {values.map(({ icon: Icon, title, text }) => (
                <motion.div key={title} variants={fadeUp} className="rounded-3xl bg-white p-5 shadow-soft transition hover:-translate-y-1">
                  <Icon className="text-brand" size={26} />
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-ink/55">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* timeline */}
        <div className="timeline relative mx-auto mt-28 max-w-4xl">
          <div className="absolute bottom-0 left-5 top-0 w-1 rounded-full bg-peach md:left-1/2 md:-translate-x-1/2" />
          <div className="timeline-line absolute bottom-0 left-5 top-0 w-1 origin-top rounded-full bg-gradient-to-b from-brand to-cheese md:left-1/2 md:-translate-x-1/2" />
          {timeline.map((t, i) => (
            <motion.div
              key={t.year}
              initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className={`relative mb-10 pl-16 last:mb-0 md:w-1/2 md:pl-0 ${i % 2 ? 'md:ml-auto md:pl-14' : 'md:pr-14 md:text-right'}`}
            >
              <span className={`absolute left-[9px] top-6 grid h-6 w-6 place-items-center rounded-full bg-white shadow-soft ring-4 ring-peach md:left-auto ${i % 2 ? 'md:-left-3' : 'md:-right-3'}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
              <div className="rounded-3xl bg-white p-6 shadow-soft">
                <span className="font-display text-sm font-extrabold tracking-widest text-brand">{t.year}</span>
                <h3 className="mt-1 text-xl font-bold">{t.title}</h3>
                <p className="mt-2 text-ink/60">{t.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

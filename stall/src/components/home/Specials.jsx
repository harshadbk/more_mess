import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { fadeUp, stagger } from '../../animations/variants'
import { useCart } from '../../context/CartContext'
import { specials } from '../../data/content'
import { findItem } from '../../data/menu'
import { cn } from '../../utils/cn'
import SectionHeading from '../ui/SectionHeading'
import SmartImage from '../ui/SmartImage'

export default function Specials() {
  const { add } = useCart()

  return (
    <section id="special" className="py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="⭐ Specials" title="The ones everyone" highlight="talks about." text="Chef picks, student favourites and today's special: the plates that made us famous." />

        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4 lg:grid-rows-2">
          {specials.map((s, i) => {
            const item = findItem(s.item)
            const big = i === 0
            return (
              <motion.button
                key={s.ribbon}
                type="button"
                variants={fadeUp}
                onClick={() => add(item.id)}
                aria-label={`Add ${item.name} to order`}
                className={cn(
                  'group relative isolate flex text-left min-h-[400px] w-[80vw] max-w-sm shrink-0 snap-center flex-col justify-end overflow-hidden rounded-[2rem] p-6 active:scale-[0.98] md:min-h-[320px] md:w-auto md:max-w-none text-white shadow-soft transition-shadow duration-500 hover:shadow-lift',
                  big && 'md:col-span-2 md:row-span-2 md:min-h-[560px] md:p-9',
                )}
              >
                <SmartImage
                  id={s.image}
                  alt={item.name}
                  ratio={big ? 1 : 1.1}
                  width={big ? 960 : 560}
                  sizes={big ? '(min-width:1024px) 50vw, 100vw' : '(min-width:1024px) 25vw, 50vw'}
                  className="absolute inset-0 -z-10"
                  imgClassName="group-hover:scale-110 duration-[1.2s]"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />

                {/* animated ribbon */}
                <div className={cn('shimmer absolute right-[-52px] top-7 w-[210px] rotate-45 bg-gradient-to-r py-1.5 text-center text-[10px] font-extrabold uppercase tracking-widest shadow-lg', s.tint)}>{s.ribbon}</div>

                <h3 className={cn('font-bold leading-tight', big ? 'text-3xl md:text-5xl' : 'text-2xl')}>{item.name}</h3>
                {big && <p className="mt-3 max-w-md text-white/75">{item.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className={cn('font-display font-extrabold', big ? 'text-4xl' : 'text-2xl')}>₹{item.price}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink transition-all duration-500 group-hover:rotate-90 group-hover:bg-brand group-hover:text-white">
                    <Plus size={22} />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

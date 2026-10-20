import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { gallery } from '../../data/content'
import { cn } from '../../utils/cn'
import { imageUrl } from '../../utils/images'
import SectionHeading from '../ui/SectionHeading'
import SmartImage from '../ui/SmartImage'

const filters = ['All', 'Food', 'Preparation', 'Customers', 'Shop']

export default function Gallery() {
  const [filter, setFilter] = useState('All')
  const [index, setIndex] = useState(null)
  const items = filter === 'All' ? gallery : gallery.filter((g) => g.tag === filter)

  const close = useCallback(() => setIndex(null), [])
  const step = useCallback((d) => setIndex((i) => (i + d + items.length) % items.length), [items.length])

  useEffect(() => {
    if (index === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [index, close, step])

  const current = index !== null ? items[index] : null

  return (
    <section id="gallery" className="py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="📸 Gallery" title="A feast for" highlight="your eyes." text="Fresh food, busy grills and happy faces. A peek into a day at our stall." />

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('rounded-full px-5 py-2.5 text-sm font-bold transition', filter === f ? 'bg-ink text-white shadow-soft' : 'bg-white text-ink/60 shadow-sm hover:text-brand')}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="columns-2 gap-4 md:columns-3 lg:gap-5 xl:columns-4">
          <AnimatePresence mode="popLayout">
            {items.map((g, i) => (
              <motion.button
                layout
                key={g.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setIndex(i)}
                className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-[1.5rem] shadow-soft lg:mb-5"
                aria-label={`Open image: ${g.alt}`}
              >
                <SmartImage id={g.id} alt={g.alt} ratio={g.ratio} width={480} sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw" style={{ aspectRatio: `1 / ${g.ratio}` }} className="w-full" imgClassName="group-hover:scale-110 duration-[900ms]" />
                <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink">{g.tag}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
                    <ZoomIn size={18} />
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
          >
            <motion.img
              key={current.id}
              src={imageUrl(current.id, 1400, Math.round(1400 * current.ratio), 80)}
              alt={current.alt}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              className="max-h-[85vh] max-w-full rounded-3xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
              {current.alt} · {index + 1}/{items.length}
            </p>
            <button onClick={close} aria-label="Close" className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:rotate-90 hover:bg-white/25">
              <X />
            </button>
            {[-1, 1].map((d) => (
              <button
                key={d}
                onClick={(e) => {
                  e.stopPropagation()
                  step(d)
                }}
                aria-label={d < 0 ? 'Previous image' : 'Next image'}
                className={cn('absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-brand', d < 0 ? 'left-4' : 'right-4')}
              >
                {d < 0 ? <ChevronLeft /> : <ChevronRight />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import SandwichMark from './SandwichMark'

/** Splash screen — shown once per browser session, kept short so it never hurts LCP. */
export default function Loader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('ss-splash')
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!show) return
    document.documentElement.style.overflow = 'hidden'
    const t = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem('ss-splash', '1')
      } catch {
        /* ignore */
      }
    }, 1500)
    return () => {
      clearTimeout(t)
      document.documentElement.style.overflow = ''
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-cream"
          exit={{ clipPath: 'circle(0% at 50% 50%)', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
          initial={{ clipPath: 'circle(150% at 50% 50%)' }}
        >
          <div className="absolute inset-0 grain opacity-60" />
          <div className="relative flex flex-col items-center">
            <motion.div
              className="grid h-32 w-32 place-items-center rounded-[2.2rem] bg-gradient-to-br from-brand to-brand-2 shadow-lift"
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            >
              <SandwichMark size={84} animate />
            </motion.div>
            <motion.p
              className="mt-7 font-display text-2xl font-extrabold"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Shree Sai <span className="text-brand">Snacks</span>
            </motion.p>
            <motion.p
              className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Fresh • Crispy • Delicious
            </motion.p>
            <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-peach">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-cheese" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.3, ease: 'easeInOut' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

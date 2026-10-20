import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Phone } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { useScrolled } from '../../hooks/useScrolled'
import { callLink, whatsappLink } from '../../utils/whatsapp'

const fab = 'grid h-12 w-12 place-items-center rounded-full shadow-lift transition-transform duration-300 hover:scale-110 active:scale-95'

/** Right-hand action rail for tablet/desktop. Mobile uses MobileTabBar instead. */
export default function FloatingActions() {
  const scrolled = useScrolled(600)

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-center gap-3 sm:flex">
      <AnimatePresence>
        {scrolled && (
          <motion.button
            key="top"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`${fab} bg-white text-ink`}
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
      <a href={callLink} className={`${fab} bg-ink text-white`} aria-label="Call us">
        <Phone size={20} />
      </a>
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={`${fab} relative h-14 w-14 bg-[#25D366] text-white`} aria-label="Order on WhatsApp">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
        <FaWhatsapp size={28} className="relative" />
      </a>
    </div>
  )
}

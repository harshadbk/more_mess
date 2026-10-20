import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import { whatsappLink } from '../../utils/whatsapp'

const messages = ['🔥 Student Special Offer', 'Extra Cheese Only ₹30', '🧀 Add it to any sandwich, toast or burger', '🎓 Show your college ID', '⚡ Fresh & ready in minutes']

export default function OfferBanner() {
  const [open, setOpen] = useState(() => {
    try {
      return !sessionStorage.getItem('ss-offer-dismissed')
    } catch {
      return true
    }
  })

  const dismiss = () => {
    setOpen(false)
    try {
      sessionStorage.setItem('ss-offer-dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="relative z-[60] overflow-hidden bg-gradient-to-r from-brand via-brand-2 to-brand bg-[length:200%_auto] text-white animate-gradient"
          role="region"
          aria-label="Current offer"
        >
          <div className="flex h-10 items-center">
            <a href={whatsappLink('Hi! I want the Student Special — Extra Cheese for ₹30 🧀')} target="_blank" rel="noopener noreferrer" className="flex flex-1 overflow-hidden">
              <div className="flex shrink-0 animate-marquee whitespace-nowrap text-[13px] font-semibold">
                {[...messages, ...messages, ...messages, ...messages].map((m, i) => (
                  <span key={i} className="mx-6 flex items-center gap-6">
                    {m}
                    <span className="h-1 w-1 rounded-full bg-white/60" />
                  </span>
                ))}
              </div>
            </a>
            <button onClick={dismiss} aria-label="Dismiss offer" className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 transition hover:rotate-90 hover:bg-white/30">
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { useCart } from '../../context/CartContext'
import { cartMessage, whatsappLink } from '../../utils/whatsapp'
import SmartImage from '../ui/SmartImage'

const qtyBtn = 'grid h-8 w-8 place-items-center rounded-full bg-peach text-brand transition active:scale-90 hover:bg-brand hover:text-white'

/**
 * Bottom order bar. Opens when a dish is added; lists the order with quantities
 * and sends it to WhatsApp. When closed with items in it, a small summary pill stays visible.
 */
export default function OrderBar() {
  const { lines, count, total, open, setOpen, change, clear } = useCart()
  const [note, setNote] = useState('')
  const shown = open && count > 0

  // Close on Escape and stop the page scrolling behind the open sheet.
  useEffect(() => {
    if (!shown) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [shown, setOpen])

  const send = () => {
    // The link opens WhatsApp in a new tab; reset the order here.
    setOpen(false)
    clear()
    setNote('')
  }

  return (
    <>
      {/* Summary pill: sits above the mobile tab bar, bottom-centre on larger screens. */}
      <AnimatePresence>
        {count > 0 && !open && (
          <motion.button
            key="pill"
            type="button"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={() => setOpen(true)}
            className="fixed inset-x-3 bottom-[96px] z-50 mx-auto flex h-14 max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-5 text-white shadow-[0_12px_30px_-8px_rgb(255_107_0/0.7)] active:scale-[0.98] sm:bottom-6"
          >
            <span className="flex items-center gap-2 font-bold">
              <ShoppingBag size={20} />
              {count} {count === 1 ? 'item' : 'items'} · ₹{total}
            </span>
            <span className="flex items-center gap-1 text-sm font-extrabold">
              View order <ChevronUp size={18} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shown && (
          <div className="fixed inset-0 z-[60]">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            />
            <motion.section
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-bar-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-lg flex-col rounded-t-[2rem] bg-cream shadow-lift"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between px-5 pb-3 pt-5">
                <h2 id="order-bar-title" className="flex items-center gap-2 text-xl font-extrabold">
                  <ShoppingBag size={22} className="text-brand" /> Your order
                </h2>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={clear} className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-ink/50 transition hover:text-tomato">
                    <Trash2 size={14} /> Clear
                  </button>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close order" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <ul className="flex-1 space-y-3 overflow-y-auto px-5">
                {lines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm">
                    <SmartImage id={item.image} alt="" width={120} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{item.name}</p>
                      <p className="text-sm text-ink/50">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => change(item.id, -1)} aria-label={`One less ${item.name}`} className={qtyBtn}>
                        <Minus size={15} strokeWidth={3} />
                      </button>
                      <span className="w-5 text-center font-display font-extrabold" aria-label={`${qty} ${item.name}`}>
                        {qty}
                      </span>
                      <button type="button" onClick={() => change(item.id, 1)} aria-label={`One more ${item.name}`} className={qtyBtn}>
                        <Plus size={15} strokeWidth={3} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 px-5 pt-4">
                <label className="block">
                  <span className="sr-only">Note for the stall</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note (e.g. less spicy, extra cheese)"
                    className="h-12 w-full rounded-2xl border-2 border-transparent bg-white px-4 text-sm outline-none transition focus:border-brand/40"
                  />
                </label>
                <div className="flex items-center justify-between font-display text-lg font-extrabold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
                <a
                  href={whatsappLink(cartMessage(lines, total, note))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={send}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-bold text-white shadow-soft transition active:scale-[0.98] hover:brightness-95"
                >
                  <FaWhatsapp size={22} /> Send order on WhatsApp
                </a>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { menu } from '../data/menu'

const CartContext = createContext(null)
const byId = Object.fromEntries(menu.map((m) => [m.id, m]))

/** The order being built before it is sent on WhatsApp: { [itemId]: quantity }. */
export function CartProvider({ children }) {
  const [qty, setQty] = useLocalStorage('ss-cart', {})
  const [open, setOpen] = useState(false)

  const change = useCallback(
    (id, by) =>
      setQty((prev) => {
        const next = { ...prev, [id]: (prev[id] ?? 0) + by }
        if (next[id] <= 0) delete next[id]
        return next
      }),
    [setQty],
  )
  const add = useCallback(
    (id) => {
      change(id, 1)
      setOpen(true)
    },
    [change],
  )
  const clear = useCallback(() => setQty({}), [setQty])

  const value = useMemo(() => {
    // Skip ids that are no longer on the menu (e.g. a saved order from before a menu change).
    const lines = Object.entries(qty)
      .filter(([id]) => byId[id])
      .map(([id, n]) => ({ item: byId[id], qty: n }))
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0)
    return { lines, count, total, open, setOpen, add, change, clear }
  }, [qty, open, add, change, clear])

  return <CartContext value={value}>{children}</CartContext>
}

export const useCart = () => useContext(CartContext)

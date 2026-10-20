import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useLocalStorage('ss-favorites', [])
  const toggle = useCallback(
    (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setIds],
  )
  const value = useMemo(() => ({ ids, toggle, has: (id) => ids.includes(id) }), [ids, toggle])
  return <FavoritesContext value={value}>{children}</FavoritesContext>
}

export const useFavorites = () => useContext(FavoritesContext)

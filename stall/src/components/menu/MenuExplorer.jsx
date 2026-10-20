import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Heart, Search, X } from 'lucide-react'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { useFavorites } from '../../context/FavoritesContext'
import { categories, extras, menu } from '../../data/menu'
import { cn } from '../../utils/cn'
import { searchMenu } from '../../utils/searchMenu'
import MenuCard from './MenuCard'

const suggestions = ['cheese', 'under 80', '50-100', 'coffee', 'paneer', 'popular']

export default function MenuExplorer({ defaultTab = 'all' }) {
  const [tab, setTab] = useState(defaultTab)
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const { ids: favIds } = useFavorites()
  const gridTop = useRef(null)

  const selectTab = (id) => {
    setQuery('')
    setTab(id)
    // If the user has scrolled down into the list, bring the new category's top into view.
    const top = gridTop.current?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 150, behavior: 'smooth' })
  }

  const searching = deferred.trim().length > 0
  const activeTab = searching ? 'all' : tab

  const results = useMemo(() => {
    if (searching) return searchMenu(menu, deferred)
    if (activeTab === 'all') return menu
    if (activeTab === 'saved') return menu.filter((m) => favIds.includes(m.id))
    return menu.filter((m) => m.category === activeTab)
  }, [searching, deferred, activeTab, favIds])

  const tabs = [
    { id: 'all', label: 'All', emoji: '✨', count: menu.length },
    ...categories.map((c) => ({ ...c, count: menu.filter((m) => m.category === c.id).length })),
    ...(favIds.length ? [{ id: 'saved', label: 'Saved', icon: Heart, count: favIds.length }] : []),
  ]

  return (
    <div>
      {/* Search */}
      <div className="mx-auto max-w-2xl">
        <label className="group relative block">
          <span className="sr-only">Search the menu</span>
          <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink/40 transition group-focus-within:text-brand" size={20} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search “cheese”, “burger”, “under 80”…"
            className="h-14 w-full rounded-full sm:h-16 border-2 border-transparent bg-white pl-14 pr-14 text-base shadow-soft outline-none transition placeholder:text-ink/35 focus:border-brand/40 focus:shadow-lift [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-mist transition hover:bg-peach hover:text-brand">
              <X size={16} />
            </button>
          )}
        </label>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-4 sm:flex-wrap sm:justify-center sm:px-0">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setQuery(s)} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-brand hover:text-brand">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <LayoutGroup id="menu-tabs">
        {/* sticky under the navbar on mobile so categories are always one tap away */}
        <div className="sticky top-16 z-30 -mx-4 mt-6 border-b border-ink/5 bg-cream/90 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mt-10 sm:border-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
        <div role="tablist" aria-label="Menu categories" className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:flex-wrap sm:justify-center sm:px-0 sm:pb-2">
          {tabs.map((t) => {
            const selected = activeTab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(t.id)}
                className={cn('relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold sm:gap-2 sm:px-5 sm:py-3 transition-colors', selected ? 'text-white' : 'bg-white text-ink/70 shadow-sm hover:text-brand')}
              >
                {selected && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-brand-2 shadow-soft" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <span className="relative">{Icon ? <Icon size={15} className="fill-current" /> : t.emoji}</span>
                <span className="relative">{t.label}</span>
                <span className={cn('relative rounded-full px-1.5 text-[11px]', selected ? 'bg-white/25' : 'bg-mist text-ink/50')}>{t.count}</span>
              </button>
            )
          })}
        </div>
        </div>
      </LayoutGroup>

      <p ref={gridTop} className="mt-4 text-center text-xs text-ink/50 sm:mt-6 sm:text-sm" aria-live="polite">
        {searching ? (
          <>
            {results.length} result{results.length !== 1 && 's'} for “<span className="font-semibold text-ink">{deferred}</span>”
          </>
        ) : (
          <>
            Showing {results.length} delicious item{results.length !== 1 && 's'} · Add <span className="font-semibold text-brand">{extras[0].name} for just ₹{extras[0].price}</span> to anything
          </>
        )}
      </p>

      {/* Grid */}
      <motion.div layout className="mt-5 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-7">
        <AnimatePresence mode="popLayout">
          {results.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </motion.div>

      {results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-sm rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-5xl">🥲</p>
          <p className="mt-4 font-display text-xl font-bold">Nothing found</p>
          <p className="mt-1 text-sm text-ink/55">Try “sandwich”, “coffee” or a price like “under 100”.</p>
        </motion.div>
      )}
    </div>
  )
}

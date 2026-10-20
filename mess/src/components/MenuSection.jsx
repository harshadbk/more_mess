import { useMemo, useState } from 'react'
import { CalendarDays, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import MenuCard from './MenuCard.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { menuCategories, menuItems, menuMeta } from '../data/menuData.js'
import { isPureVeg, isSet } from '../utils/business.js'
import { messages } from '../utils/whatsapp.js'

const categoryLabel = Object.fromEntries(menuCategories.map((c) => [c.id, c.label]))

// Pure-veg businesses never show non-veg sample items.
const visibleItems = menuItems.filter((item) => !(isPureVeg && item.diet === 'non-veg'))
const hasSamples = visibleItems.some((item) => item.isSample)

const formatDate = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MenuSection() {
  const [category, setCategory] = useState('all')

  const items = useMemo(
    () => (category === 'all' ? visibleItems : visibleItems.filter((i) => i.category === category)),
    [category],
  )

  const updatedOn = !hasSamples && isSet(menuMeta.updatedOn) ? formatDate(menuMeta.updatedOn) : ''

  return (
    <section id="menu" aria-labelledby="menu-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="menu-title" eyebrow="Menu" title="What's cooking at Sai Mess">
          Wholesome, home-style plates for your daily meals. Today's menu is posted fresh every day.
        </SectionHeading>

        <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-between gap-3 rounded-xl bg-saffron-soft/70 px-4 py-3 text-sm text-charcoal sm:flex-row">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-forest" aria-hidden="true" />
            See what's cooking today and order your tiffin.
          </p>
          <a href="#order-today" className="btn-primary min-h-10 shrink-0 px-4 text-sm">
            <ShoppingBag className="size-4" aria-hidden="true" />
            Order for Today
          </a>
        </div>
        {updatedOn && <p className="mt-4 text-center text-sm text-muted">Menu last updated on {updatedOn}</p>}

        <div
          role="group"
          aria-label="Filter menu by meal"
          className="mx-auto mt-10 flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:justify-center"
        >
          {menuCategories.map((c) => {
            const selected = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.id)}
                className={`min-h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition-colors ${
                  selected
                    ? 'border-forest bg-forest text-white'
                    : 'border-line bg-white text-charcoal/80 hover:border-forest/40 hover:text-forest'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          Showing {items.length} {items.length === 1 ? 'dish' : 'dishes'}
          {category !== 'all' ? ` for ${categoryLabel[category]}` : ''}
        </p>

        {items.length ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <MenuCard
                  item={item}
                  categoryLabel={categoryLabel[item.category] ?? item.category}
                  servingTime={item.servingTime || businessConfig.mealTimings[item.category] || ''}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-forest/25 bg-white px-6 py-12 text-center">
            <UtensilsCrossed className="mx-auto size-8 text-fresh" aria-hidden="true" />
            <p className="mt-4 font-display text-lg font-bold">
              No {categoryLabel[category]?.toLowerCase()} dishes listed yet
            </p>
            <p className="mt-2 text-sm text-muted">Message us and we will tell you what is being served.</p>
            <WhatsAppButton message={messages.general()} className="btn-primary mt-6">
              Ask on WhatsApp
            </WhatsAppButton>
          </div>
        )}
      </div>
    </section>
  )
}

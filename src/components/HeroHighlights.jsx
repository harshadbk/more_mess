import { useEffect, useState } from 'react'
import { ChevronRight, Coffee, Moon, Sun, UtensilsCrossed } from 'lucide-react'
import { Stars } from './Testimonials.jsx'
import { api } from '../lib/api.js'

const MEALS = [
  { meal: 'breakfast', label: 'Breakfast', icon: Coffee },
  { meal: 'lunch', label: 'Lunch', icon: Sun },
  { meal: 'dinner', label: 'Dinner', icon: Moon },
]

/** Top of the home page: the customers' rating (links to the reviews) and today's dishes (link to the menu). */
export function RatingBadge() {
  const [reviews, setReviews] = useState(null) // { count, average }

  useEffect(() => {
    api('/reviews?limit=1')
      .then(setReviews)
      .catch(() => setReviews(null))
  }, [])

  if (!reviews) return null

  return (
    <a
      href="#reviews"
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm whitespace-nowrap shadow-sm transition-colors hover:border-saffron"
    >
      {reviews.count ? (
        <>
          <Stars rating={reviews.average} />
          <strong className="text-forest">{reviews.average.toFixed(1)}</strong>
          <span className="truncate text-muted">
            ({reviews.count} {reviews.count === 1 ? 'review' : 'reviews'})
          </span>
        </>
      ) : (
        <>
          <Stars rating={0} />
          <span className="truncate text-muted">Be the first to rate us</span>
        </>
      )}
      <span className="font-semibold text-forest">Rate us</span>
      <ChevronRight className="size-4 text-forest transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  )
}

export function TodaysMealLinks() {
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    api('/menu')
      .then(setMenu)
      .catch(() => setMenu(null))
  }, [])

  // One chip per meal that has dishes posted and is still open today.
  const chips = MEALS.map((m) => ({
    ...m,
    dishes: (menu?.dishes ?? []).filter((d) => d.meal === m.meal).map((d) => d.name),
    open: !menu?.locked?.includes(m.meal),
  })).filter((m) => m.dishes.length)

  if (!chips.length) return null

  // One compact line: "Today:" + a chip per meal + "Full menu". Long dish lists are cut short.
  return (
    <ul className="mt-5 flex flex-wrap items-center gap-2" aria-label="On the menu today">
      <li className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
        <UtensilsCrossed className="size-4 text-fresh" aria-hidden="true" />
        Today:
      </li>
      {chips.map(({ meal, label, icon: Icon, dishes, open }) => (
        <li key={meal} className="min-w-0 max-w-full">
          <a
            href={open ? '#order-today' : '#todays-menu'}
            className={`flex max-w-full min-w-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${
              open ? 'bg-forest/10 text-forest hover:bg-forest/15' : 'bg-cream-dark text-muted hover:bg-cream-dark/70'
            }`}
            title={`${label}: ${dishes.join(', ')}${open ? '' : ' (orders closed for today)'}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only font-semibold sm:not-sr-only">{label}:</span>
            <span className="max-w-[11rem] truncate">{dishes.join(', ')}</span>
            {!open && <span className="shrink-0 text-xs">(closed)</span>}
          </a>
        </li>
      ))}
      <li>
        <a href="#todays-menu" className="flex items-center gap-0.5 text-sm font-semibold text-forest hover:underline">
          Full menu
          <ChevronRight className="size-4" aria-hidden="true" />
        </a>
      </li>
    </ul>
  )
}

import { UtensilsCrossed } from 'lucide-react'
import { rupees } from '../../data/accountOptions.js'

/** Small veg / non-veg mark (green square for veg, red for non-veg), with a text label for screen readers. */
export function FoodMark({ food }) {
  const veg = food !== 'non-veg'
  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2 ${
        veg ? 'border-fresh' : 'border-[#b4442a]'
      }`}
      title={veg ? 'Veg' : 'Non-veg'}
    >
      <span className={`size-1.5 rounded-full ${veg ? 'bg-fresh' : 'bg-[#b4442a]'}`} />
      <span className="sr-only">{veg ? 'Veg' : 'Non-veg'}</span>
    </span>
  )
}

/** One dish: photo (or placeholder), veg mark, name, description and optional price. */
export default function DishItem({ dish, showPrice = false, children }) {
  return (
    <div className="flex items-center gap-3">
      {dish.image ? (
        <img src={dish.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" loading="lazy" />
      ) : (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-cream-dark text-muted">
          <UtensilsCrossed className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          <FoodMark food={dish.food} />
          <span className="truncate">{dish.name}</span>
        </p>
        {dish.description && <p className="truncate text-sm text-muted">{dish.description}</p>}
        {showPrice && dish.price > 0 && <p className="text-sm font-semibold text-forest">{rupees(dish.price)}</p>}
      </div>
      {children}
    </div>
  )
}

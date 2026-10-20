import { categories } from '../data/menu'

const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label.toLowerCase()]))

/**
 * Instant search across name, category and price.
 *   "cheese"      → name / description match
 *   "burger"      → whole category
 *   "80"          → everything ₹80 or less
 *   "under 100"   → price ≤ 100   (also "below", "<", "upto")
 *   "50-100"      → price range
 */
export function searchMenu(items, rawQuery) {
  const q = rawQuery.trim().toLowerCase().replace(/₹|rs\.?/g, '').trim()
  if (!q) return items

  const range = q.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/)
  if (range) {
    const [lo, hi] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b)
    return items.filter((i) => i.price >= lo && i.price <= hi)
  }

  const max = q.match(/^(?:under|below|less than|upto|up to|<|<=)?\s*(\d+)$/)
  if (max) return items.filter((i) => i.price <= Number(max[1]))

  const min = q.match(/^(?:above|over|more than|>|>=)\s*(\d+)$/)
  if (min) return items.filter((i) => i.price >= Number(min[1]))

  const terms = q.split(/\s+/)
  return items.filter((i) => {
    const hay = `${i.name} ${i.description} ${catLabel[i.category]} ${i.popular ? 'popular' : ''} ${i.chef ? 'chef' : ''}`.toLowerCase()
    return terms.every((t) => hay.includes(t) || hay.includes(t.replace(/s$/, '')))
  })
}

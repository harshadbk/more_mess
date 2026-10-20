/** Choices shown on sign-up and in the dashboards. Values must match the backend (backend/src/models). */

export const planOptions = [
  { value: 'daily', label: 'Daily', hint: 'Pay day by day' },
  { value: 'weekly', label: 'Weekly', hint: 'Pay every week' },
  { value: 'monthly', label: 'Monthly', hint: 'Pay every month' },
]

/** The three daily meals, in order. `value` matches the backend. */
export const mealOptions = [
  { value: 'breakfast', label: 'Breakfast', hint: 'Morning' },
  { value: 'lunch', label: 'Lunch', hint: 'Day tiffin' },
  { value: 'dinner', label: 'Dinner', hint: 'Night tiffin' },
]
export const MEALS = mealOptions.map((m) => m.value)

export const foodOptions = [
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-veg' },
  { value: 'jain', label: 'Jain' },
]

export const occupationOptions = [
  { value: 'student', label: 'Student' },
  { value: 'working', label: 'Working professional' },
  { value: 'other', label: 'Other' },
]

const labelOf = (options) => (value) => options.find((o) => o.value === value)?.label ?? value

export const planLabel = labelOf(planOptions)
export const foodLabel = labelOf(foodOptions)
export const mealLabel = labelOf(mealOptions)

/** ['breakfast', 'lunch'] -> 'Breakfast + Lunch' */
export const mealsLabel = (meals = []) =>
  MEALS.filter((m) => meals.includes(m))
    .map(mealLabel)
    .join(' + ') || 'No daily meals'

/** Today's date in India as 'YYYY-MM-DD' (matches the backend). */
export const todayIST = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** 'YYYY-MM-DD' plus or minus some days. */
export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`

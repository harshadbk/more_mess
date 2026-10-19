/**
 * MEAL PLANS & PRICING
 * ----------------------------------------------------------------------------
 * price          number in rupees (e.g. 3200) or null -> shows "Contact us for pricing"
 * includedMeals  e.g. ['Lunch', 'Dinner']  — empty -> "Confirm included meals on enquiry"
 * timings        optional override text; empty -> uses mealTimings from businessConfig
 * conditions     e.g. ['Sunday dinner not included', 'Advance payment required']
 *
 * highlightedPlanId: set to a plan id (e.g. 'monthly') ONLY after the owner
 * confirms which plan to recommend. null -> no plan is highlighted.
 */

export const highlightedPlanId = null

export const mealPlans = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    summary: 'For students and working professionals who want their daily meals sorted for the month.',
    price: null,
    priceUnit: 'per month',
    duration: '1 month',
    includedMeals: [],
    timings: '',
    conditions: [],
  },
  {
    id: 'weekly',
    name: 'Weekly Plan',
    summary: 'A flexible option if you are new to the area or want to try Sai Mess first.',
    price: null,
    priceUnit: 'per week',
    duration: '1 week',
    includedMeals: [],
    timings: '',
    conditions: [],
  },
  {
    id: 'single',
    name: 'Single Meal',
    summary: 'Drop in for one meal whenever you need a proper home-style plate.',
    price: null,
    priceUnit: 'per meal',
    duration: 'One meal',
    includedMeals: [],
    timings: '',
    conditions: [],
  },
]

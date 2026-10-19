import { ShieldCheck } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import MealPlanCard from './MealPlanCard.jsx'
import Reveal from './Reveal.jsx'
import { highlightedPlanId, mealPlans } from '../data/mealPlans.js'

export default function MealPlans() {
  return (
    <section
      id="meal-plans"
      aria-labelledby="plans-title"
      className="relative overflow-hidden border-y border-line bg-cream-dark/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading id="plans-title" eyebrow="Meal plans" title="Pick a plan that fits your routine">
          Eat with us every day, for a week, or just once. Every enquiry goes straight to the owner on WhatsApp — no
          online payment, no automatic sign-up.
        </SectionHeading>

        <ul className="mt-14 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {mealPlans.map((plan, i) => (
            <Reveal as="li" key={plan.id} delay={i * 90} className={i === 2 ? 'md:col-span-2 lg:col-span-1' : ''}>
              <MealPlanCard plan={plan} highlighted={plan.id === highlightedPlanId} />
            </Reveal>
          ))}
        </ul>

        <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <ShieldCheck className="size-4 shrink-0 text-fresh" aria-hidden="true" />
          Plans, timings and payment are confirmed directly with the owner.
        </p>
      </div>
    </section>
  )
}

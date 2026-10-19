import { CalendarDays, Check, Clock, Info } from 'lucide-react'
import WhatsAppButton from './WhatsAppButton.jsx'
import { messages } from '../utils/whatsapp.js'
import { formatPrice, mealTimingList } from '../utils/business.js'

function Detail({ icon: Icon, label, children, highlighted }) {
  return (
    <div className="flex gap-3">
      <Icon
        className={`mt-0.5 size-[18px] shrink-0 ${highlighted ? 'text-saffron' : 'text-fresh'}`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt
          className={`text-xs font-semibold tracking-wider uppercase ${highlighted ? 'text-white/60' : 'text-muted'}`}
        >
          {label}
        </dt>
        <dd className="mt-1 text-[15px] leading-relaxed">{children}</dd>
      </div>
    </div>
  )
}

export default function MealPlanCard({ plan, highlighted = false }) {
  const price = formatPrice(plan.price)
  const timings = plan.timings || mealTimingList.map((m) => `${m.label} ${m.time}`).join(' · ')
  const muted = highlighted ? 'text-white/70' : 'text-muted'

  return (
    <article
      className={`relative flex h-full flex-col rounded-3xl p-7 sm:p-8 ${
        highlighted ? 'bg-forest text-white shadow-lift lg:-my-4 lg:py-12' : 'card'
      }`}
      aria-labelledby={`plan-${plan.id}`}
    >
      {highlighted && (
        <p className="absolute -top-3.5 left-7 rounded-full bg-saffron px-3.5 py-1 text-xs font-bold tracking-wider text-charcoal uppercase">
          Recommended
        </p>
      )}
      <h3 id={`plan-${plan.id}`} className={`text-xl font-extrabold ${highlighted ? 'text-white' : ''}`}>
        {plan.name}
      </h3>
      <p className={`mt-2 text-[15px] leading-relaxed ${muted}`}>{plan.summary}</p>

      <div className={`mt-6 border-y py-5 ${highlighted ? 'border-white/15' : 'border-line'}`}>
        {price ? (
          <p className="flex items-baseline gap-2">
            <span className={`font-display text-4xl font-extrabold ${highlighted ? 'text-white' : 'text-forest'}`}>
              {price}
            </span>
            <span className={`text-sm ${muted}`}>{plan.priceUnit}</span>
          </p>
        ) : (
          <p>
            <span
              className={`block font-display text-2xl font-extrabold ${highlighted ? 'text-white' : 'text-forest'}`}
            >
              Contact us for pricing
            </span>
            <span className={`mt-1 block text-sm ${muted}`}>Current rates shared on WhatsApp or phone</span>
          </p>
        )}
      </div>

      <dl className="mt-6 space-y-5">
        <Detail icon={Check} label="Included meals" highlighted={highlighted}>
          {plan.includedMeals.length ? (
            plan.includedMeals.join(', ')
          ) : (
            <span className={muted}>Confirm included meals on enquiry</span>
          )}
        </Detail>
        <Detail icon={Clock} label="Meal timings" highlighted={highlighted}>
          {timings || <span className={muted}>Shared on enquiry</span>}
        </Detail>
        <Detail icon={CalendarDays} label="Duration" highlighted={highlighted}>
          {plan.duration}
        </Detail>
        {plan.conditions.length > 0 && (
          <Detail icon={Info} label="Good to know" highlighted={highlighted}>
            <ul className="space-y-1">
              {plan.conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Detail>
        )}
      </dl>

      <div className="mt-auto pt-8">
        <WhatsAppButton
          message={messages.plan(plan)}
          signUp="Join with this plan"
          className={`${highlighted ? 'btn-saffron' : 'btn-primary'} w-full`}
        >
          Enquire About This Plan
        </WhatsAppButton>
      </div>
    </article>
  )
}

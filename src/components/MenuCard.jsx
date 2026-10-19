import { Clock } from 'lucide-react'
import WhatsAppButton from './WhatsAppButton.jsx'
import { messages } from '../utils/whatsapp.js'
import { formatPrice } from '../utils/business.js'

export function DietBadge({ diet }) {
  const veg = diet === 'veg'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm ${
        veg ? 'text-fresh' : 'text-[#9b3b1f]'
      }`}
    >
      {/* Indian veg / non-veg symbol */}
      <span
        aria-hidden="true"
        className={`inline-flex size-3.5 items-center justify-center rounded-[3px] border-[1.5px] ${
          veg ? 'border-fresh' : 'border-[#9b3b1f]'
        }`}
      >
        <span className={`size-1.5 rounded-full ${veg ? 'bg-fresh' : 'bg-[#9b3b1f]'}`} />
      </span>
      {veg ? 'Veg' : 'Non-veg'}
    </span>
  )
}

export default function MenuCard({ item, categoryLabel, servingTime }) {
  const price = formatPrice(item.price)
  return (
    <article className="group card flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lift">
      <div className="relative overflow-hidden bg-cream-dark">
        <img
          src={item.image}
          alt={item.imageAlt}
          width="800"
          height="600"
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-forest/90 px-2.5 py-1 text-xs font-semibold text-white">
            {categoryLabel}
          </span>
          {item.diet && <DietBadge diet={item.diet} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug font-bold">{item.name}</h3>
          {price && <p className="shrink-0 font-display text-lg font-extrabold text-forest">{price}</p>}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.description}</p>
        {servingTime && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-charcoal/80">
            <Clock className="size-4 text-fresh" aria-hidden="true" />
            {servingTime}
          </p>
        )}
        <div className="mt-auto pt-5">
          <WhatsAppButton
            message={messages.dish(item, categoryLabel)}
            className="btn min-h-11 w-full border border-forest/20 bg-cream text-sm text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            Enquire on WhatsApp
            <span className="sr-only"> about {item.name}</span>
          </WhatsAppButton>
        </div>
      </div>
    </article>
  )
}

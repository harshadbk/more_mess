import { ArrowRight, CalendarCheck, Leaf, MapPin, ShoppingBag, Users } from 'lucide-react'
import WhatsAppButton from './WhatsAppButton.jsx'
import { RatingBadge, TodaysMealLinks } from './HeroHighlights.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { messages } from '../utils/whatsapp.js'
import { foodTypeLabel, mealTimingList, shortLocation, showCustomerCount } from '../utils/business.js'

export default function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-10%] size-[34rem] rounded-full bg-saffron-soft/70 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(rgb(23 77 53 / 0.12) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
          }}
        />
      </div>

      <div className="container-page relative grid items-center gap-12 pt-4 pb-16 sm:pt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pt-6 lg:pb-20">
        <div className="max-w-xl lg:max-w-none">
          <div className="mb-4">
            <RatingBadge />
          </div>
          <p className="eyebrow">
            <span className="h-px w-6 bg-fresh" aria-hidden="true" />
            Your daily meal destination
          </p>
          <h1
            id="hero-title"
            className="mt-3 text-[2.4rem] leading-[1.05] font-extrabold text-forest sm:text-6xl lg:text-[3.6rem]"
          >
            Ghar Jaisa Khana,{' '}
            <span className="relative whitespace-nowrap text-charcoal">
              Roz Aapke Saath.
              <svg
                aria-hidden="true"
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full text-saffron"
              >
                <path
                  d="M2 10c60-7 140-9 296-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            Delicious, satisfying daily meals made for your everyday routine. Discover the menu, explore meal plans, and
            find your place at {businessConfig.name}.
          </p>

          <TodaysMealLinks />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#menu" className="btn-primary group sm:px-5">
              Explore Our Menu
              <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a href="#order-today" className="btn-saffron sm:px-5">
              <ShoppingBag className="size-[18px]" aria-hidden="true" />
              Order for Today
            </a>
            <WhatsAppButton signUp="Join Sai Mess" message={messages.join()} className="btn-outline sm:px-5">
              Join Us on WhatsApp
            </WhatsAppButton>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-charcoal/80">
            {shortLocation && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-fresh" aria-hidden="true" />
                {shortLocation}
              </li>
            )}
            {foodTypeLabel && (
              <li className="flex items-center gap-2">
                <Leaf className="size-4 text-fresh" aria-hidden="true" />
                {foodTypeLabel}
              </li>
            )}
            <li className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-fresh" aria-hidden="true" />
              Weekly &amp; monthly meal plans
            </li>
          </ul>
        </div>

        {/* Image composition */}
        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-3 translate-x-4 translate-y-4 rounded-[2rem] border-2 border-dashed border-forest/15 sm:-inset-4"
          />
          <div className="relative overflow-hidden rounded-[1.75rem] bg-cream-dark shadow-lift">
            <img
              src="/images/thali-steel.webp"
              alt="Home-style steel thali with chapatis, mixed vegetable sabzi, dal, pickle and a glass of buttermilk"
              width="1400"
              height="933"
              fetchpriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]"
            />
          </div>

          <div className="absolute -bottom-8 -left-2 w-[32%] sm:w-[38%] overflow-hidden rounded-2xl border-4 border-cream shadow-lift sm:-left-8">
            <img
              src="/images/dal-bowl.webp"
              alt="Copper bowl of tadka dal"
              width="800"
              height="1200"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="absolute -top-5 right-3 hidden w-[30%] overflow-hidden rounded-2xl border-4 border-cream shadow-lift sm:block lg:-right-6">
            <img
              src="/images/masala-dosa.webp"
              alt="Masala dosa with chutneys"
              width="800"
              height="533"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="absolute right-3 -bottom-6 max-w-[58%] rounded-2xl border border-line bg-white px-4 py-3 shadow-lift sm:right-6 sm:px-5 sm:py-4">
            {showCustomerCount ? (
              <p className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-saffron-soft text-forest">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm leading-tight text-muted">
                  <strong className="block font-display text-xl text-forest">
                    {businessConfig.customerCount.value}
                  </strong>
                  regular customers
                </span>
              </p>
            ) : (
              <>
                <p className="font-display text-sm font-bold text-forest sm:text-base">
                  {mealTimingList.length ? mealTimingList.map((m) => m.label).join(' · ') : 'Daily home-style meals'}
                </p>
                <p className="mt-0.5 text-xs text-muted sm:text-sm">Plans &amp; pricing on WhatsApp</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

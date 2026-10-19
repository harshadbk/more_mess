import { CalendarCheck, CookingPot, HeartHandshake, Wallet } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'

const benefits = [
  {
    icon: CookingPot,
    title: 'Home-style meals',
    text: 'Simple, comforting food in the style of a home kitchen — the kind of plate you can happily eat every day.',
  },
  {
    icon: Wallet,
    title: 'Affordable meal options',
    text: 'Choose a monthly, weekly or single-meal option that suits your budget and how often you eat out.',
  },
  {
    icon: CalendarCheck,
    title: 'Daily meal convenience',
    text: 'Regular meal times that fit around college, office or shifts, so you never have to plan your next meal.',
  },
  {
    icon: HeartHandshake,
    title: 'A welcoming mess',
    text: 'A friendly, no-fuss place to sit down and enjoy a proper meal — whether it is your first visit or your fiftieth.',
  },
]

export default function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="border-y border-line bg-white py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading id="benefits-title" eyebrow="Why Sai Mess" title="Made for everyday eating">
          For students, hostel residents, bachelors and working professionals who want a dependable meal without the
          daily hassle.
        </SectionHeading>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 80}
              className="group bg-white p-7 transition-colors hover:bg-cream sm:p-8"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-forest text-saffron transition-transform duration-300 group-hover:-translate-y-0.5">
                <Icon className="size-6" aria-hidden="true" strokeWidth={1.8} />
              </span>
              <h3 className="mt-6 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

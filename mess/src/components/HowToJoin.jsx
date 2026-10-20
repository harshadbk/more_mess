import { Link } from 'react-router-dom'
import { ClipboardList, LogIn, MessageSquareText, Phone, UtensilsCrossed } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { messages } from '../utils/whatsapp.js'
import { hasPhone, phoneHref } from '../utils/business.js'
import { useAuth } from '../context/AuthContext.jsx'

const steps = [
  {
    icon: UtensilsCrossed,
    title: 'Explore the menu & plans',
    text: 'Look through the menu and choose the meal plan that suits your routine.',
    link: { href: '#meal-plans', label: 'See meal plans' },
  },
  {
    icon: MessageSquareText,
    title: 'Contact Sai Mess',
    text: 'Send a WhatsApp message or call. Ask anything about meals, timings or pricing.',
    link: { href: '#contact', label: 'Contact details' },
  },
  {
    icon: ClipboardList,
    title: 'Confirm with the owner',
    text: 'Finalise your plan, meal timings and visit details directly with the owner.',
  },
]

export default function HowToJoin() {
  const { user } = useAuth()

  return (
    <section aria-labelledby="join-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="join-title" eyebrow="How to join" title="Start eating with us in three steps" />

        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-forest/20 md:block"
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map(({ icon: Icon, title, text, link }, i) => (
              <Reveal as="li" key={title} delay={i * 100} className="relative text-center">
                <span className="relative mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-forest text-saffron shadow-soft">
                  <Icon className="size-6" aria-hidden="true" strokeWidth={1.8} />
                  <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-saffron font-display text-xs font-extrabold text-charcoal">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-6 text-lg font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{text}</p>
                {link && (
                  <a
                    href={link.href}
                    className="mt-3 inline-block text-sm font-semibold text-forest underline decoration-saffron decoration-2 underline-offset-4 hover:text-fresh"
                  >
                    {link.label}
                  </a>
                )}
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal className="relative mt-20 overflow-hidden rounded-[2rem] bg-forest px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 size-64 rounded-full border-[28px] border-white/5"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-16 size-56 rounded-full bg-saffron/15 blur-2xl"
          />
          <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl">Ready for Your Daily Meals?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/75 sm:text-lg">
            Message us to ask about plans, timings and today's menu.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {!user && (
              <Link to="/login" className="btn-ghost-light">
                <LogIn className="size-[18px]" aria-hidden="true" />
                Log in
              </Link>
            )}
            <WhatsAppButton signUp="Join Sai Mess" message={messages.join()} className="btn-saffron">
              Join on WhatsApp
            </WhatsAppButton>
            {hasPhone && (
              <a href={phoneHref} className="btn-ghost-light">
                <Phone className="size-[18px]" aria-hidden="true" />
                Call Now
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

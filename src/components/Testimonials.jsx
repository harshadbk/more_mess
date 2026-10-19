import { MessageSquareText, Quote } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import { testimonials } from '../data/testimonials.js'

export default function Testimonials() {
  if (!testimonials.length) {
    // Never show fake reviews. On the live site the section is hidden;
    // during development, remind the owner where to add genuine feedback.
    if (!import.meta.env.DEV) return null
    return (
      <section aria-label="Customer reviews (setup reminder)" className="py-12">
        <div className="container-page">
          <div className="mx-auto flex max-w-2xl items-start gap-4 rounded-2xl border border-dashed border-forest/30 bg-white p-6">
            <MessageSquareText className="mt-0.5 size-6 shrink-0 text-fresh" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted">
              <strong className="text-charcoal">Reviews section hidden.</strong> Add genuine customer feedback (with
              permission) in <code className="rounded bg-cream px-1">src/data/testimonials.js</code> and it will appear
              here. This note is only visible during development.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="reviews-title" className="border-y border-line bg-white py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="reviews-title" eyebrow="From our regulars" title="What customers say" />
        <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 80}>
              <figure className="card flex h-full flex-col p-7">
                <Quote className="size-8 text-saffron" aria-hidden="true" />
                <blockquote className="mt-4 flex-1 leading-relaxed text-charcoal">{t.quote}</blockquote>
                <figcaption className="mt-6 border-t border-line pt-4">
                  <p className="font-display font-bold">{t.name}</p>
                  {t.role && <p className="text-sm text-muted">{t.role}</p>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

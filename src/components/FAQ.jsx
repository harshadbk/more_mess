import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { faqs } from '../data/faqData.js'
import { messages } from '../utils/whatsapp.js'

// Answers depend only on static config, so resolve them once.
const resolvedFaqs = faqs.map((f) => ({ ...f, resolved: f.answer() }))

function FaqItem({ faq, open, onToggle }) {
  const buttonId = `faq-btn-${faq.id}`
  const panelId = `faq-panel-${faq.id}`
  return (
    <li className="border-b border-line last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-base font-bold text-charcoal transition-colors hover:text-forest sm:text-lg"
        >
          {faq.question}
          <span
            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-300 ${
              open ? 'rotate-180 border-forest bg-forest text-white' : 'border-line text-forest'
            }`}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows,visibility] duration-300 ${
          open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pr-12 pb-6 text-[15px] leading-relaxed text-muted">
            {faq.resolved ? (
              <p>{faq.resolved}</p>
            ) : (
              <>
                <p>Please ask us directly and we will share the latest details.</p>
                <WhatsAppButton message={messages.faq(faq.question)} className="btn-outline mt-4 min-h-10 px-4 text-sm">
                  Ask on WhatsApp
                </WhatsAppButton>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function FAQ() {
  const [openId, setOpenId] = useState(resolvedFaqs[0]?.id ?? null)

  return (
    <section aria-labelledby="faq-title" className="border-y border-line bg-white py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions, answered" align="left">
            Can't find what you're looking for? Send us a message and we'll help.
          </SectionHeading>
          <WhatsAppButton message={messages.general()} className="btn-primary mt-8">
            Ask a Question
          </WhatsAppButton>
        </div>

        <ul className="rounded-2xl border border-line bg-cream/50 px-5 sm:px-8">
          {resolvedFaqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              open={openId === faq.id}
              onToggle={() => setOpenId((cur) => (cur === faq.id ? null : faq.id))}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

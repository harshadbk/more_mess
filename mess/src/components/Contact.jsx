import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { mealPlans } from '../data/mealPlans.js'
import {
  formatIndianNumber,
  fullAddress,
  hasPhone,
  hasWhatsApp,
  isSet,
  mapEmbedUrl,
  mapUrl,
  mealTimingList,
  normalizeIndianNumber,
  phoneDigits,
  phoneHref,
  whatsappDigits,
} from '../utils/business.js'
import { buildWhatsAppUrl, messages } from '../utils/whatsapp.js'

const planOptions = [...mealPlans.map((p) => p.name), 'Not sure yet']
const emptyForm = { name: '', phone: '', plan: '', message: '' }
const fieldOrder = ['name', 'phone', 'plan', 'message']

function validate(values) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Please enter your name.'
  else if (name.length < 2) errors.name = 'Name looks too short.'
  if (!values.phone.trim()) errors.phone = 'Please enter your phone number.'
  else if (!normalizeIndianNumber(values.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.'
  if (!values.plan) errors.plan = 'Please choose a meal plan.'
  if (values.message.length > 500) errors.message = 'Please keep the message under 500 characters.'
  return errors
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-4">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest/8 text-forest">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</dt>
        <dd className="mt-1 text-[15px] leading-relaxed text-charcoal">{children}</dd>
      </div>
    </div>
  )
}

const inputClass = (invalid) =>
  `mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-base text-charcoal placeholder:text-muted/70 transition-colors focus:outline-none focus-visible:ring-4 ${
    invalid
      ? 'border-[#b4442a] focus-visible:ring-[#b4442a]/15'
      : 'border-line hover:border-forest/40 focus-visible:border-forest focus-visible:ring-forest/15'
  }`

/** Shown instead of the WhatsApp enquiry form until the business number is added. */
function JoinOnline() {
  return (
    <div>
      <h3 className="text-xl font-extrabold">Join Sai Mess online</h3>
      <p className="mt-2 text-[15px] text-muted">
        Create a free account to choose your plan (daily, weekly or monthly), pick lunch, dinner or both, and join with
        friends as a group if you like.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/register" className="btn-primary flex-1">
          <Send className="size-[18px]" aria-hidden="true" />
          Create account
        </Link>
        <Link to="/login" className="btn-outline flex-1">
          Log in
        </Link>
      </div>
    </div>
  )
}

function EnquiryForm() {
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [draft, setDraft] = useState(null)
  const formRef = useRef(null)
  const previewRef = useRef(null)

  const update = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    const firstInvalid = fieldOrder.find((f) => found[f])
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus()
      return
    }
    const digits = normalizeIndianNumber(values.phone)
    const text = messages.contactForm({
      name: values.name.trim(),
      phone: formatIndianNumber(digits),
      plan: values.plan,
      message: values.message.trim(),
    })
    setDraft({ text, url: buildWhatsAppUrl(text) })
    requestAnimationFrame(() => previewRef.current?.focus())
  }

  if (draft) {
    return (
      <div ref={previewRef} tabIndex={-1} role="region" className="focus:outline-none" aria-labelledby="draft-title">
        <h3 id="draft-title" className="text-xl font-extrabold">
          Review your WhatsApp message
        </h3>
        <p className="mt-2 text-[15px] text-muted">
          Nothing has been sent yet. Tap the button below to open WhatsApp, then press send to share this enquiry with{' '}
          {businessConfig.name}.
        </p>
        <pre className="mt-5 rounded-2xl border border-line bg-cream p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-charcoal">
          {draft.text}
        </pre>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={draft.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
            <MessageCircle className="size-[18px]" aria-hidden="true" />
            Open WhatsApp to Send
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <button type="button" className="btn-outline" onClick={() => setDraft(null)}>
            <ArrowLeft className="size-[18px]" aria-hidden="true" />
            Edit details
          </button>
        </div>
      </div>
    )
  }

  const err = (f) => (errors[f] ? { 'aria-invalid': true, 'aria-describedby': `${f}-error` } : {})

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-labelledby="form-title">
      <h3 id="form-title" className="text-xl font-extrabold">
        Send an enquiry
      </h3>
      <p className="mt-2 text-[15px] text-muted">
        Fill in your details and we'll prepare a WhatsApp message for you to send. Fields marked * are required.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-charcoal">
            Full name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={60}
            value={values.name}
            onChange={update}
            className={inputClass(errors.name)}
            {...err('name')}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-sm text-[#b4442a]">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-semibold text-charcoal">
            Phone number *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="10-digit mobile"
            value={values.phone}
            onChange={update}
            className={inputClass(errors.phone)}
            {...err('phone')}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1.5 text-sm text-[#b4442a]">
              {errors.phone}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="plan" className="text-sm font-semibold text-charcoal">
            Preferred meal plan *
          </label>
          <div className="relative">
            <select
              id="plan"
              name="plan"
              value={values.plan}
              onChange={update}
              className={`${inputClass(errors.plan)} appearance-none pr-11`}
              {...err('plan')}
            >
              <option value="" disabled>
                Choose a plan
              </option>
              {planOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 bottom-3.5 size-5 text-forest"
              aria-hidden="true"
            />
          </div>
          {errors.plan && (
            <p id="plan-error" className="mt-1.5 text-sm text-[#b4442a]">
              {errors.plan}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="text-sm font-semibold text-charcoal">
            Message <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={500}
            placeholder="E.g. preferred start date, which meals you need, any questions"
            value={values.message}
            onChange={update}
            className={`${inputClass(errors.message)} resize-y`}
            {...err('message')}
          />
          {errors.message && (
            <p id="message-error" className="mt-1.5 text-sm text-[#b4442a]">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary mt-6 w-full">
        <Send className="size-[18px]" aria-hidden="true" />
        Continue to WhatsApp
      </button>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck className="mt-px size-4 shrink-0 text-fresh" aria-hidden="true" />
        Your details are not saved on this website. They are only placed in a WhatsApp message that you choose to send.
      </p>
    </form>
  )
}

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="contact-title" eyebrow="Visit & contact" title="Come hungry, leave happy">
          Reach out on WhatsApp or by phone to ask about plans, timings and today's menu.
        </SectionHeading>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <Reveal className="flex flex-col gap-6">
            <div className="card p-6 sm:p-8">
              <dl className="space-y-6">
                {fullAddress && (
                  <InfoRow icon={MapPin} label="Address">
                    {fullAddress}
                  </InfoRow>
                )}
                {hasPhone && (
                  <InfoRow icon={Phone} label="Phone">
                    <a href={phoneHref} className="font-semibold text-forest hover:underline">
                      {formatIndianNumber(phoneDigits)}
                    </a>
                  </InfoRow>
                )}
                <InfoRow icon={MessageCircle} label="WhatsApp">
                  {hasWhatsApp ? (
                    <WhatsAppButton
                      icon={false}
                      className="font-semibold text-forest hover:underline"
                      message={messages.general()}
                    >
                      {formatIndianNumber(whatsappDigits)}
                    </WhatsAppButton>
                  ) : (
                    <span className="text-muted">Number coming soon</span>
                  )}
                </InfoRow>
                {isSet(businessConfig.openingDays) && (
                  <InfoRow icon={CalendarDays} label="Open">
                    {businessConfig.openingDays}
                  </InfoRow>
                )}
                <InfoRow icon={Clock} label="Meal timings">
                  {mealTimingList.length ? (
                    <ul className="space-y-1">
                      {mealTimingList.map((m) => (
                        <li key={m.id} className="flex flex-wrap justify-between gap-x-6">
                          <span className="font-medium">{m.label}</span>
                          <span className="text-muted">{m.time}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">Ask us on WhatsApp for current timings</span>
                  )}
                </InfoRow>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton message={messages.general()} className="btn-primary flex-1">
                  WhatsApp Us
                </WhatsAppButton>
                {hasPhone && (
                  <a href={phoneHref} className="btn-outline flex-1">
                    <Phone className="size-[18px]" aria-hidden="true" />
                    Call Now
                  </a>
                )}
              </div>
            </div>

            {mapEmbedUrl ? (
              <div className="overflow-hidden rounded-2xl border border-line bg-cream-dark shadow-soft">
                <iframe
                  src={mapEmbedUrl}
                  title={`Map showing the location of ${businessConfig.name}`}
                  className="block h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : null}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline self-start">
                <Navigation className="size-[18px]" aria-hidden="true" />
                Open in Google Maps
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </Reveal>

          <Reveal delay={100} className="card p-6 sm:p-8">
            {hasWhatsApp ? <EnquiryForm /> : <JoinOnline />}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

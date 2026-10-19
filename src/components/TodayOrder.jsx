import { useRef, useState } from 'react'
import { ArrowLeft, Bike, Clock, MessageCircle, Store } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import Field, { ChoiceGroup } from './account/Field.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { formatIndianNumber, hasWhatsApp, mealTimingList, normalizeIndianNumber } from '../utils/business.js'
import { buildWhatsAppUrl, messages } from '../utils/whatsapp.js'

const mealChoices = [
  { value: 'Lunch (day)', label: 'Lunch', hint: 'Day tiffin' },
  { value: 'Dinner (night)', label: 'Dinner', hint: 'Night tiffin' },
  { value: 'Lunch and dinner', label: 'Both', hint: 'Day and night' },
]
const foodChoices = [
  { value: 'Veg', label: 'Veg' },
  { value: 'Non-veg', label: 'Non-veg' },
]
const deliveryChoices = [
  { value: 'pickup', label: 'I will pick up', hint: 'Come to the mess' },
  { value: 'delivery', label: 'Deliver to me', hint: 'If available in your area' },
]

const emptyOrder = {
  name: '',
  phone: '',
  meal: 'Lunch (day)',
  count: '1',
  food: 'Veg',
  delivery: 'pickup',
  address: '',
  note: '',
}

function validate(v) {
  const errors = {}
  if (v.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!normalizeIndianNumber(v.phone)) errors.phone = 'Enter a valid 10-digit mobile number.'
  const count = Number(v.count)
  if (!Number.isInteger(count) || count < 1 || count > 50) errors.count = 'Enter 1 to 50 tiffins.'
  if (v.delivery === 'delivery' && v.address.trim().length < 5) errors.address = 'Enter the delivery address.'
  return errors
}

/** "Order for today only": builds a WhatsApp message with all details; the mess replies on WhatsApp. */
export default function TodayOrder() {
  const [values, setValues] = useState(emptyOrder)
  const [errors, setErrors] = useState({})
  const [draft, setDraft] = useState(null)
  const formRef = useRef(null)
  const previewRef = useRef(null)

  if (!hasWhatsApp) return null

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }
  const onInput = (e) => set(e.target.name)(e.target.value)

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    const first = ['name', 'phone', 'count', 'address'].find((f) => found[f])
    if (first) return formRef.current?.elements[first]?.focus()

    const text = messages.todayOrder({
      date: today,
      name: values.name.trim(),
      phone: formatIndianNumber(normalizeIndianNumber(values.phone)),
      meal: values.meal,
      count: Number(values.count),
      food: values.food,
      delivery: values.delivery === 'delivery' ? 'Please deliver' : 'I will pick up from the mess',
      address: values.delivery === 'delivery' ? values.address.trim() : '',
      note: values.note.trim(),
    })
    setDraft({ text, url: buildWhatsAppUrl(text) })
    requestAnimationFrame(() => previewRef.current?.focus())
  }

  return (
    <section id="order-today" aria-labelledby="order-today-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="order-today-title" eyebrow="Just for today" title="Order a tiffin for today only">
          No plan or account needed. Fill in your order, send it on WhatsApp, and {businessConfig.name} will reply to
          confirm it and the price.
        </SectionHeading>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1fr_18rem]">
          <Reveal className="card p-6 sm:p-8">
            {draft ? (
              <div
                ref={previewRef}
                tabIndex={-1}
                role="region"
                aria-labelledby="order-draft-title"
                className="focus:outline-none"
              >
                <h3 id="order-draft-title" className="text-xl font-extrabold">
                  Check your order
                </h3>
                <p className="mt-2 text-[15px] text-muted">
                  Nothing has been sent yet. Tap the button to open WhatsApp, then press send.
                </p>
                <pre className="mt-5 rounded-2xl border border-line bg-cream p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-charcoal">
                  {draft.text}
                </pre>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={draft.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
                    <MessageCircle className="size-[18px]" aria-hidden="true" />
                    Send order on WhatsApp
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <button type="button" className="btn-outline" onClick={() => setDraft(null)}>
                    <ArrowLeft className="size-[18px]" aria-hidden="true" />
                    Edit order
                  </button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
                <p className="text-sm font-semibold text-fresh">Order for {today}</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Your name *"
                    name="name"
                    autoComplete="name"
                    maxLength={60}
                    value={values.name}
                    onChange={onInput}
                    error={errors.name}
                  />
                  <Field
                    label="Mobile number *"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={values.phone}
                    onChange={onInput}
                    error={errors.phone}
                  />
                </div>
                <ChoiceGroup
                  label="Which meal?"
                  name="meal"
                  options={mealChoices}
                  value={values.meal}
                  onChange={set('meal')}
                />
                <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                  <Field
                    label="How many tiffins? *"
                    name="count"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    value={values.count}
                    onChange={onInput}
                    error={errors.count}
                  />
                  <fieldset>
                    <legend className="text-sm font-semibold text-charcoal">Food</legend>
                    <div className="mt-2 flex gap-2">
                      {foodChoices.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          aria-pressed={values.food === f.value}
                          onClick={() => set('food')(f.value)}
                          className={`flex-1 rounded-xl border px-4 py-3 font-semibold transition-colors ${
                            values.food === f.value
                              ? 'border-forest bg-forest/5 text-forest'
                              : 'border-line bg-white text-charcoal hover:border-forest/40'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <ChoiceGroup
                  label="Pickup or delivery?"
                  name="delivery"
                  options={deliveryChoices}
                  value={values.delivery}
                  onChange={set('delivery')}
                />
                {values.delivery === 'delivery' && (
                  <Field
                    label="Delivery address *"
                    name="address"
                    autoComplete="street-address"
                    placeholder="Room / building, landmark"
                    maxLength={200}
                    value={values.address}
                    onChange={onInput}
                    error={errors.address}
                  />
                )}
                <Field
                  label="Anything else? (optional)"
                  name="note"
                  placeholder="e.g. less spicy, extra chapati, coming at 1 PM"
                  maxLength={300}
                  value={values.note}
                  onChange={onInput}
                />
                <button type="submit" className="btn-primary w-full">
                  <MessageCircle className="size-[18px]" aria-hidden="true" />
                  Prepare WhatsApp order
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={100} className="space-y-4">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Clock className="size-5 text-fresh" aria-hidden="true" />
                Today's timings
              </h3>
              <ul className="mt-3 space-y-1.5 text-[15px]">
                {mealTimingList.map((m) => (
                  <li key={m.id} className="flex justify-between gap-4">
                    <span className="font-medium">{m.label}</span>
                    <span className="text-muted">{m.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6 text-[15px] text-muted">
              <p className="flex gap-2">
                <Store className="mt-0.5 size-5 shrink-0 text-fresh" aria-hidden="true" />
                Order before the meal time so we can keep your tiffin ready.
              </p>
              <p className="mt-3 flex gap-2">
                <Bike className="mt-0.5 size-5 shrink-0 text-fresh" aria-hidden="true" />
                Delivery depends on your area. We will confirm on WhatsApp.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

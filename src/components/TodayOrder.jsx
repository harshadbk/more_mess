import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bike, Clock, Coffee, Lock, MessageCircle, Moon, Store, Sun } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import Field, { ChoiceGroup, FormError } from './account/Field.jsx'
import DishItem from './account/DishItem.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { api } from '../lib/api.js'
import { todayIST } from '../data/accountOptions.js'
import { formatIndianNumber, hasWhatsApp, normalizeIndianNumber } from '../utils/business.js'
import { buildWhatsAppUrl, messages } from '../utils/whatsapp.js'

const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: Sun },
  { id: 'dinner', label: 'Dinner', icon: Moon },
]
const foodChoices = [
  { value: 'Veg', label: 'Veg' },
  { value: 'Non-veg', label: 'Non-veg' },
]

// Non-veg is only served on Sundays and Wednesdays (same rule as the backend).
const nonVegToday = () => [0, 3].includes(new Date(`${todayIST()}T00:00:00Z`).getUTCDay())
const nowIST = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).slice(0, 5)
// '07:00' -> '7:00 AM'
const clock = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
const deliveryChoices = [
  { value: 'pickup', label: 'I will pick up', hint: 'Come to the mess' },
  { value: 'delivery', label: 'Deliver to me', hint: 'If available in your area' },
]

const emptyOrder = {
  name: '',
  phone: '',
  meals: [], // 'breakfast' | 'lunch' | 'dinner'
  choice: {}, // meal -> dish id picked from today's menu
  count: '1',
  food: 'Veg',
  delivery: 'pickup',
  address: '',
  note: '',
}

function validate(v) {
  const errors = {}
  if (!v.meals.length) errors.meals = 'Pick at least one meal.'
  if (v.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!normalizeIndianNumber(v.phone)) errors.phone = 'Enter a valid 10-digit mobile number.'
  const count = Number(v.count)
  if (!Number.isInteger(count) || count < 1 || count > 50) errors.count = 'Enter 1 to 50 tiffins.'
  if (v.delivery === 'delivery' && v.address.trim().length < 5) errors.address = 'Enter the delivery address.'
  return errors
}

/**
 * "Order for today only": saves the order (so the kitchen and the admin panel see it), then builds a WhatsApp
 * message with all details and the order number; the mess replies on WhatsApp to confirm it.
 */
export default function TodayOrder() {
  const [values, setValues] = useState(emptyOrder)
  const [errors, setErrors] = useState({})
  const [draft, setDraft] = useState(null)
  const [sent, setSent] = useState(false) // true after they open WhatsApp to send
  const [saved, setSaved] = useState(null) // { id, token } once saved; "Edit order" then updates the same order
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const formRef = useRef(null)
  const previewRef = useRef(null)
  const [menu, setMenu] = useState(null) // today's menu, cut-off times and closed meals (null = not loaded)
  const [now, setNow] = useState(nowIST())

  useEffect(() => {
    api('/menu')
      .then(setMenu)
      .catch(() => setMenu(null)) // server unreachable: the form still works, without menu options
    const timer = setInterval(() => setNow(nowIST()), 60 * 1000) // meals close while the page is open
    return () => clearInterval(timer)
  }, [])

  // A meal can't be ordered after its cut-off time today.
  const closed = (meal) => Boolean(menu?.locked?.includes(meal) || (menu?.cutoffs && now >= menu.cutoffs[meal]))
  // Closing meals drop out of the order.
  useEffect(() => {
    setValues((v) => (v.meals.some(closed) ? { ...v, meals: v.meals.filter((m) => !closed(m)) } : v))
  }, [now, menu]) // eslint-disable-line react-hooks/exhaustive-deps

  const nonVegDay = menu?.nonVegDay ?? nonVegToday()
  const food = nonVegDay ? values.food : 'Veg'
  // Today's options for a meal, of the chosen kind (all of them if there are none of that kind).
  const optionsOf = (meal) => {
    const all = (menu?.dishes ?? []).filter((d) => d.meal === meal)
    const kind = all.filter((d) => (d.food === 'non-veg') === (food === 'Non-veg'))
    return kind.length ? kind : all
  }
  const pickedOf = (meal) => optionsOf(meal).find((d) => d._id === values.choice[meal]) ?? optionsOf(meal)[0]

  if (!hasWhatsApp) return null

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }
  const onInput = (e) => set(e.target.name)(e.target.value)

  const toggleMeal = (meal) => {
    set('meals')(values.meals.includes(meal) ? values.meals.filter((m) => m !== meal) : [...values.meals, meal])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaveError('')
    const found = validate(values)
    setErrors(found)
    const first = ['name', 'phone', 'meals', 'count', 'address'].find((f) => found[f])
    if (first) {
      const field = formRef.current?.elements[first] // the meal checkboxes come back as a list
      return (field?.focus ? field : field?.[0])?.focus()
    }

    // e.g. "Breakfast (Poha), Lunch (Veg thali)"
    const meal = MEALS.filter((m) => values.meals.includes(m.id))
      .map((m) => (pickedOf(m.id) ? `${m.label} (${pickedOf(m.id).name})` : m.label))
      .join(', ')

    // Save it first, so it shows up in the kitchen list. If the server can't be reached, WhatsApp still works.
    let code = ''
    setSaving(true)
    try {
      const body = {
        name: values.name.trim(),
        phone: normalizeIndianNumber(values.phone),
        meals: values.meals,
        choice: Object.fromEntries(values.meals.map((m) => [m, pickedOf(m)?._id]).filter(([, id]) => id)),
        count: Number(values.count),
        food: food === 'Non-veg' ? 'non-veg' : 'veg',
        delivery: values.delivery,
        address: values.address.trim(),
        note: values.note.trim(),
      }
      const { order, token } = saved
        ? await api(`/guest-orders/${saved.id}`, { method: 'PUT', body: { ...body, token: saved.token } })
        : await api('/guest-orders', { method: 'POST', body })
      if (!saved) setSaved({ id: order._id, token })
      code = order.code
    } catch (err) {
      if (err.status) {
        // The server said no (e.g. a meal just closed): fix the form first.
        setSaveError(err.message)
        return
      }
    } finally {
      setSaving(false)
    }

    const text = messages.todayOrder({
      code,
      date: today,
      name: values.name.trim(),
      phone: formatIndianNumber(normalizeIndianNumber(values.phone)),
      meal,
      count: Number(values.count),
      food,
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
            {sent ? (
              <div role="status" className="py-6 text-center">
                <MessageCircle className="mx-auto size-10 text-fresh" aria-hidden="true" />
                <h3 className="mt-3 text-xl font-extrabold">Order sent on WhatsApp</h3>
                <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">
                  {businessConfig.name} will reply on WhatsApp to confirm your order and the price. If WhatsApp
                  didn&apos;t open, tap below to try again.
                </p>
                <button type="button" className="btn-outline mt-6" onClick={() => setSent(false)}>
                  Place another order
                </button>
              </div>
            ) : draft ? (
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
                  Your order is noted. Tap the button to open WhatsApp, then press send so we can confirm it.
                </p>
                <pre className="mt-5 rounded-2xl border border-line bg-cream p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-charcoal">
                  {draft.text}
                </pre>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1"
                    onClick={() => {
                      // Let the link open first, then clear the preview and the form.
                      setTimeout(() => {
                        setDraft(null)
                        setValues(emptyOrder)
                        setSaved(null) // the next order is a new one
                        setSent(true)
                      }, 300)
                    }}
                  >
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
                <fieldset>
                  <legend className="text-sm font-semibold text-charcoal">Which meals? *</legend>
                  <p className="mt-0.5 text-sm text-muted">
                    Today’s menu from {businessConfig.name}. Pick one or more meals, and one option for each.
                  </p>
                  <div className="mt-2 space-y-2">
                    {MEALS.map(({ id, label, icon: Icon }) => {
                      const isClosed = closed(id)
                      const checked = values.meals.includes(id)
                      const options = optionsOf(id)
                      return (
                        <div
                          key={id}
                          className={`rounded-xl border px-4 py-3 ${
                            checked ? 'border-forest bg-forest/5' : 'border-line bg-white'
                          } ${isClosed ? 'opacity-60' : ''}`}
                        >
                          <label className={`flex items-center gap-3 ${isClosed ? '' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              name="meals"
                              checked={checked}
                              disabled={isClosed}
                              onChange={() => toggleMeal(id)}
                              className="size-4 accent-[#174d35]"
                            />
                            <Icon className="size-5 text-fresh" aria-hidden="true" />
                            <span className="flex-1 font-semibold">{label}</span>
                            {menu?.cutoffs && (
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold ${isClosed ? 'text-[#b4442a]' : 'text-muted'}`}
                              >
                                {isClosed && <Lock className="size-3.5" aria-hidden="true" />}
                                {isClosed ? 'Closed for today' : `Order by ${clock(menu.cutoffs[id])}`}
                              </span>
                            )}
                          </label>
                          {options.length > 0 && (
                            <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                              {options.map((d) => (
                                <li key={d._id}>
                                  <label
                                    className={`flex items-center gap-3 rounded-lg p-1.5 ${isClosed ? '' : 'cursor-pointer hover:bg-forest/5'}`}
                                  >
                                    <input
                                      type="radio"
                                      name={`today-${id}`}
                                      checked={checked && pickedOf(id)?._id === d._id}
                                      disabled={isClosed}
                                      onChange={() => {
                                        // Picking a dish also ticks its meal.
                                        setValues((v) => ({
                                          ...v,
                                          choice: { ...v.choice, [id]: d._id },
                                          meals: v.meals.includes(id) ? v.meals : [...v.meals, id],
                                        }))
                                        if (errors.meals) setErrors((err) => ({ ...err, meals: undefined }))
                                      }}
                                      className="size-4 shrink-0 accent-[#174d35]"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <DishItem
                                        dish={{ ...d, price: d.price > 0 ? d.price : menu.prices?.[id] || 0 }}
                                        showPrice
                                      />
                                    </div>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                          {menu && options.length === 0 && !isClosed && (
                            <p className="mt-2 text-sm text-muted">
                              Today’s {label.toLowerCase()} menu isn’t posted yet.
                              {checked && ' We’ll tell you on WhatsApp.'}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {errors.meals && (
                    <p role="alert" className="mt-1.5 text-sm text-[#b4442a]">
                      {errors.meals}
                    </p>
                  )}
                </fieldset>
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
                    {!nonVegDay && (
                      <p className="mt-0.5 text-sm text-muted">Veg only today. Non-veg on Sundays and Wednesdays.</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {foodChoices.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          aria-pressed={food === f.value}
                          disabled={f.value === 'Non-veg' && !nonVegDay}
                          onClick={() => set('food')(f.value)}
                          className={`flex-1 rounded-xl border px-4 py-3 font-semibold transition-colors disabled:opacity-40 ${
                            food === f.value
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
                <FormError message={saveError} />
                <button type="submit" className="btn-primary w-full" disabled={saving}>
                  <MessageCircle className="size-[18px]" aria-hidden="true" />
                  {saving ? 'Saving your order…' : 'Prepare WhatsApp order'}
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
              <ul className="mt-3 space-y-2.5 text-[15px]">
                {MEALS.map(({ id, label }) => {
                  const time = businessConfig.mealTimings[id]
                  return (
                    <li key={id}>
                      <p className="flex justify-between gap-4">
                        <span className="font-medium">{label}</span>
                        <span className="text-right text-muted">{time || (menu?.cutoffs ? '' : '–')}</span>
                      </p>
                      {menu?.cutoffs && (
                        <p className={`text-xs ${closed(id) ? 'font-semibold text-[#b4442a]' : 'text-muted'}`}>
                          {closed(id)
                            ? `Orders closed at ${clock(menu.cutoffs[id])}`
                            : `Order by ${clock(menu.cutoffs[id])}`}
                        </p>
                      )}
                    </li>
                  )
                })}
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

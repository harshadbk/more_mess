import { useEffect, useState } from 'react'
import { Coffee, Lock, Minus, Moon, Plus, ShoppingCart, Sparkles, Sun, Users } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useNotice } from '../Notice.jsx'
import DishItem from './DishItem.jsx'
import { addDays, formatDate, rupees, todayIST } from '../../data/accountOptions.js'

const sections = [
  { meal: 'breakfast', label: 'Breakfast', icon: Coffee },
  { meal: 'lunch', label: 'Lunch', icon: Sun },
  { meal: 'dinner', label: 'Dinner', icon: Moon },
  { meal: 'special', label: 'Specials', icon: Sparkles },
]
const mealName = Object.fromEntries(sections.map((s) => [s.meal, s.label]))

// A cart line is keyed by meal + dish ("lunch|<dish id>"; plain tiffin = "lunch|").
const keyOf = (meal, dish) => `${meal}|${dish ?? ''}`
const linesFrom = (items) => Object.fromEntries(items.map((i) => [keyOf(i.meal, i.dish), i.qty]))
const sameLines = (a, b) =>
  JSON.stringify(
    Object.entries(a)
      .filter(([, q]) => q > 0)
      .sort(),
  ) ===
  JSON.stringify(
    Object.entries(b)
      .filter(([, q]) => q > 0)
      .sort(),
  )

function Stepper({ qty, max, disabled, onChange, label }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={disabled || qty <= 0}
        className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-white disabled:opacity-40"
        aria-label={`One less ${label}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="w-7 text-center font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={disabled || qty >= max}
        className="inline-flex size-8 items-center justify-center rounded-full bg-forest text-white disabled:opacity-40"
        aria-label={`One more ${label}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * The daily order ("cart"): pick options from the admin's menu, set how many, see the bill, place it.
 * In a group this is ONE order for everyone and only the owner can change it.
 */
export default function OrderCart({ planKey, onSaved }) {
  const notify = useNotice()
  const [date, setDate] = useState(todayIST())
  const [day, setDay] = useState(null) // everything from GET /orders
  const [lines, setLines] = useState({}) // what's in the cart now: { key: qty }
  const [busy, setBusy] = useState(false)

  const load = (data) => {
    setDay(data)
    setLines(linesFrom(data.order.items))
  }

  useEffect(() => {
    setDay(null)
    api(`/orders?date=${date}`)
      .then(load)
      .catch((err) => notify(err.message))
  }, [date, planKey, notify])

  if (!day) {
    return (
      <section className="card p-6">
        <p className="text-muted">Loading the menu…</p>
      </section>
    )
  }

  const { account, dishes, prices, cutoffs, locked, order } = day
  const isGroup = account.kind === 'group'
  const max = isGroup ? 100 : 10
  const editable = account.canEdit && date >= todayIST()
  const dirty = !sameLines(lines, linesFrom(order.items))

  // Every cart line with its name and price (menu options + plain tiffins from the plan).
  const priceOf = (meal, dish) => (dish ? (dish.price > 0 ? dish.price : prices[meal] || 0) : prices[meal] || 0)
  const cartLines = Object.entries(lines)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const [meal, dishId] = key.split('|')
      const dish = dishes.find((d) => d._id === dishId)
      const saved = order.items.find((i) => keyOf(i.meal, i.dish) === key)
      return {
        key,
        meal,
        qty,
        dishId: dishId || null,
        name: dish?.name ?? saved?.name ?? `${mealName[meal]} tiffin`,
        price: dish ? priceOf(meal, dish) : (saved?.price ?? priceOf(meal, null)),
        plain: !dishId,
      }
    })
    .sort((a, b) => sections.findIndex((s) => s.meal === a.meal) - sections.findIndex((s) => s.meal === b.meal))
  const total = cartLines.reduce((sum, l) => sum + l.price * l.qty, 0)

  const setQty = (key, qty) => setLines((l) => ({ ...l, [key]: Math.max(0, Math.min(max, qty)) }))

  const place = async () => {
    setBusy(true)
    try {
      const data = await api('/orders', {
        method: 'PUT',
        body: { date, items: cartLines.map((l) => ({ meal: l.meal, dish: l.dishId, qty: l.qty })) },
      })
      load(data)
      const closed = data.lockedNow?.filter((m) => cartLines.some((l) => l.meal === m)) ?? []
      notify(
        closed.length
          ? `Order saved. ${closed.map((m) => mealName[m]).join(', ')} was already closed, so it was not changed.`
          : `Order placed for ${formatDate(date)}: ${rupees(data.order.amount)}.`,
      )
      onSaved?.()
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Only meals the admin posted options for are shown.
  const shown = sections.filter((s) => dishes.some((d) => d.meal === s.meal))

  return (
    <section className="card p-6" aria-labelledby="cart-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cart-title" className="flex items-center gap-2 text-lg font-extrabold">
          <ShoppingCart className="size-5 text-fresh" aria-hidden="true" />
          {isGroup ? 'Group order' : 'My order'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Today', value: todayIST() },
            { label: 'Tomorrow', value: todayIST(1) },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setDate(d.value)}
              aria-pressed={date === d.value}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                date === d.value ? 'bg-forest text-white' : 'bg-cream-dark text-charcoal hover:bg-forest/10'
              }`}
            >
              {d.label}
            </button>
          ))}
          <input
            type="date"
            aria-label="Pick another day"
            min={todayIST()}
            max={addDays(todayIST(), 30)}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <p className="mt-1 text-sm text-muted">
        {formatDate(date)}
        {isGroup && (
          <>
            {' · '}
            <Users className="inline size-4 align-[-3px] text-fresh" aria-hidden="true" /> {account.name},{' '}
            {account.people} members
          </>
        )}
        {' · '}
        {order.custom ? (
          <span className="font-semibold text-saffron">Changed by hand</span>
        ) : order.items.length ? (
          'From plans'
        ) : (
          'Nothing ordered yet'
        )}
      </p>

      {isGroup && (
        <p className="mt-3 rounded-xl bg-forest/5 px-4 py-3 text-sm">
          {account.canEdit
            ? 'You are the owner: this is one order for the whole group. It starts with 1 tiffin per member who takes that meal. Set how many are actually eating; the group bill follows the cart.'
            : 'This is your group’s order. Only the group’s owner can change it. Ask them if you are not eating today.'}
        </p>
      )}
      {day.startsOn && !cartLines.length && (
        <p className="mt-3 rounded-xl bg-saffron-soft/60 px-4 py-3 text-sm">
          Daily tiffins start automatically from {formatDate(day.startsOn)}.
          {editable && ' To eat on this day, add tiffins below and place the order.'}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-8 text-center text-muted">
          The menu for {formatDate(date)} isn’t posted yet. Check back soon.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {shown.map(({ meal, label, icon: Icon }) => {
            const isLocked = locked.includes(meal)
            const cutoff = meal === 'special' ? cutoffs.dinner : cutoffs[meal]
            return (
              <div
                key={meal}
                className={`rounded-2xl border p-4 ${meal === 'special' ? 'border-saffron/50 bg-saffron-soft/30' : 'border-line'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold">
                    <Icon
                      className={`size-5 ${meal === 'special' ? 'text-saffron' : 'text-fresh'}`}
                      aria-hidden="true"
                    />
                    {label}
                    <span className="text-sm font-normal text-muted">
                      {meal === 'special' ? 'extra, priced per dish' : `pick one or more options`}
                    </span>
                  </p>
                  {date === todayIST() && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${isLocked ? 'text-[#b4442a]' : 'text-muted'}`}
                    >
                      {isLocked && <Lock className="size-3.5" aria-hidden="true" />}
                      {isLocked ? `Closed at ${cutoff}` : `Order by ${cutoff}`}
                    </span>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-line">
                  {dishes
                    .filter((d) => d.meal === meal)
                    .map((d) => {
                      const key = keyOf(meal, d._id)
                      return (
                        <li key={d._id} className="py-2.5">
                          <DishItem dish={{ ...d, price: priceOf(meal, d) }} showPrice>
                            <Stepper
                              qty={lines[key] || 0}
                              max={max}
                              disabled={!editable || isLocked}
                              onChange={(q) => setQty(key, q)}
                              label={d.name}
                            />
                          </DishItem>
                        </li>
                      )
                    })}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-cream-dark/50 p-4">
        <h3 className="font-bold">Bill for {formatDate(date)}</h3>
        {cartLines.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing in the cart.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {cartLines.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-muted">{mealName[l.meal]}:</span> {l.name}
                  {l.plain && <span className="text-xs text-muted"> (menu not posted yet)</span>}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {l.plain && editable && !locked.includes(l.meal) && (
                    <Stepper qty={l.qty} max={max} onChange={(q) => setQty(l.key, q)} label={l.name} />
                  )}
                  <span className="tabular-nums">
                    {l.qty} × {rupees(l.price)} = <strong>{rupees(l.qty * l.price)}</strong>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p>
            Total: <strong className="font-display text-2xl text-forest">{rupees(total)}</strong>
          </p>
          {editable && (
            <button type="button" onClick={place} disabled={busy || !dirty} className="btn-primary min-h-11 px-6">
              {busy
                ? 'Placing…'
                : !dirty
                  ? 'Order placed ✓'
                  : order.custom || order.items.length
                    ? 'Update order'
                    : 'Place order'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

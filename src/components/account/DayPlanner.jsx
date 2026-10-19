import { useEffect, useState } from 'react'
import { Coffee, Minus, Moon, Plus, Sparkles, Sun } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useNotice } from '../Notice.jsx'
import DishItem from './DishItem.jsx'
import { addDays, formatDate, MEALS, mealLabel, rupees, todayIST } from '../../data/accountOptions.js'

const mealIcons = { breakfast: Coffee, lunch: Sun, dinner: Moon }

/** Price of a day's choice, same formula as the backend. */
const dayCost = (choice, prices, specials) =>
  MEALS.reduce((sum, m) => sum + (choice[m] ? prices[m] || 0 : 0), 0) +
  specials.reduce((sum, d) => sum + d.price * (choice.qty[d._id] || 0), 0)

/** Comparable text for a choice: meals on/off + specials with qty > 0 (so 0 counts as "none"). */
const keyOf = (c) =>
  JSON.stringify([
    MEALS.map((m) => Boolean(c[m])),
    Object.entries(c.qty)
      .filter(([, qty]) => qty > 0)
      .sort(),
  ])

/**
 * Pick a day (today, tomorrow or later), see its menu, choose meals and specials, save.
 * onSaved() lets the dashboard refresh totals.
 */
export default function DayPlanner({ planKey, onSaved }) {
  const notify = useNotice()
  const [date, setDate] = useState(todayIST())
  const [menu, setMenu] = useState(null)
  const [saved, setSaved] = useState(null) // what the server has
  const [choice, setChoice] = useState(null) // what the user is editing
  const [busy, setBusy] = useState(false)

  // Load the menu and my order whenever the day (or my plan) changes.
  useEffect(() => {
    setMenu(null)
    setChoice(null)
    Promise.all([api(`/menu?date=${date}`), api(`/orders?date=${date}`)])
      .then(([m, { order }]) => {
        setMenu(m)
        const start = {
          ...Object.fromEntries(MEALS.map((meal) => [meal, Boolean(order[meal])])),
          qty: Object.fromEntries(order.specials.map((s) => [s.dish, s.qty])),
        }
        setSaved({ ...start, custom: order.custom, startsOn: order.startsOn })
        setChoice(start)
      })
      .catch((err) => notify(err.message))
  }, [date, planKey, notify])

  const specials = menu?.dishes.filter((d) => d.meal === 'special') ?? []
  const dirty = Boolean(choice && saved) && keyOf(choice) !== keyOf(saved)

  const setQty = (id, qty) => setChoice((c) => ({ ...c, qty: { ...c.qty, [id]: Math.max(0, Math.min(20, qty)) } }))

  const save = async () => {
    setBusy(true)
    try {
      const body = {
        date,
        ...Object.fromEntries(MEALS.map((m) => [m, choice[m]])),
        specials: Object.entries(choice.qty)
          .filter(([, qty]) => qty > 0)
          .map(([dish, qty]) => ({ dish, qty })),
      }
      const { order } = await api('/orders', { method: 'PUT', body })
      const next = {
        ...Object.fromEntries(MEALS.map((meal) => [meal, order[meal]])),
        qty: Object.fromEntries(order.specials.map((s) => [s.dish, s.qty])),
      }
      setSaved({ ...next, custom: true })
      setChoice(next)
      notify(`Saved your tiffins for ${formatDate(date)}.`)
      onSaved?.()
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  const quickDays = [
    { label: 'Today', value: todayIST() },
    { label: 'Tomorrow', value: todayIST(1) },
  ]

  return (
    <section className="card p-6" aria-labelledby="planner-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="planner-title" className="text-lg font-extrabold">
          Menu &amp; my tiffins
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {quickDays.map((d) => (
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
        {formatDate(date)} ·{' '}
        {saved?.custom ? (
          <span className="font-semibold text-saffron">You changed this day</span>
        ) : saved?.startsOn ? (
          <span className="font-semibold text-saffron">
            Your daily tiffins start {formatDate(saved.startsOn)}. To eat on this day, tap the meals and save.
          </span>
        ) : (
          'As per your plan'
        )}
      </p>

      {!choice || !menu ? (
        <p className="mt-6 text-muted">Loading menu…</p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {MEALS.map((meal) => {
              const Icon = mealIcons[meal]
              const dishes = menu.dishes.filter((d) => d.meal === meal)
              const on = choice[meal]
              return (
                <div
                  key={meal}
                  className={`rounded-2xl border p-4 transition-colors ${on ? 'border-forest/40 bg-forest/[0.03]' : 'border-line'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-bold">
                      <Icon className="size-5 text-fresh" aria-hidden="true" />
                      {mealLabel(meal)}
                      {menu.prices[meal] > 0 && (
                        <span className="text-sm font-normal text-muted">{rupees(menu.prices[meal])}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setChoice((c) => ({ ...c, [meal]: !c[meal] }))}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                        on ? 'bg-forest text-white' : 'border border-line bg-white text-muted'
                      }`}
                    >
                      {on ? 'Taking ✓' : 'Skip'}
                    </button>
                  </div>
                  {dishes.length ? (
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {dishes.map((d) => (
                        <li key={d._id}>
                          <DishItem dish={d} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted">Menu not posted yet.</p>
                  )}
                </div>
              )
            })}

            {specials.length > 0 && (
              <div className="rounded-2xl border border-saffron/50 bg-saffron-soft/40 p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Sparkles className="size-5 text-saffron" aria-hidden="true" />
                  Specials <span className="text-sm font-normal text-muted">(extra, add as many as you like)</span>
                </p>
                <ul className="mt-3 space-y-3">
                  {specials.map((d) => {
                    const qty = choice.qty[d._id] || 0
                    return (
                      <li key={d._id}>
                        <DishItem dish={d} showPrice>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQty(d._id, qty - 1)}
                              disabled={!qty}
                              className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-white disabled:opacity-40"
                              aria-label={`One less ${d.name}`}
                            >
                              <Minus className="size-4" aria-hidden="true" />
                            </button>
                            <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(d._id, qty + 1)}
                              className="inline-flex size-8 items-center justify-center rounded-full bg-forest text-white"
                              aria-label={`One more ${d.name}`}
                            >
                              <Plus className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </DishItem>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              This day:{' '}
              <strong className="text-lg text-forest">{rupees(dayCost(choice, menu.prices, specials))}</strong>
            </p>
            <button type="button" onClick={save} disabled={busy || !dirty} className="btn-primary min-h-11 px-6">
              {busy ? 'Saving…' : dirty ? 'Save my choice' : 'Saved'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

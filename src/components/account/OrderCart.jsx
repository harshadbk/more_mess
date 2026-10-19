import { useEffect, useState } from 'react'
import {
  Check,
  Coffee,
  Drumstick,
  Leaf,
  Lock,
  Minus,
  Moon,
  Plus,
  ShoppingCart,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotice } from '../Notice.jsx'
import DishItem from './DishItem.jsx'
import { addDays, formatDate, rupees, todayIST } from '../../data/accountOptions.js'

const MEALS = [
  { meal: 'breakfast', label: 'Breakfast', icon: Coffee },
  { meal: 'lunch', label: 'Lunch', icon: Sun },
  { meal: 'dinner', label: 'Dinner', icon: Moon },
]
const mealName = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', special: 'Special' }
const KINDS = [
  { food: 'veg', label: 'Veg', icon: Leaf },
  { food: 'non-veg', label: 'Non-veg', icon: Drumstick },
]

// Members of a group whose plan includes `meal` (everyone if nobody's does).
const planEaters = (people, meal) => {
  const eaters = people.filter((u) => u.meals?.includes(meal))
  return (eaters.length ? eaters : people).map((u) => String(u._id))
}

// The cart: ONE option per meal ({ dish, qty }, dish null = standard tiffin) plus any number of specials.
// For a group (`people` = its members) each meal also has `members`: the ids ticked as eating it (qty = how many).
function cartFrom(items, people = null) {
  const meals = {}
  const specials = {}
  for (const i of items) {
    if (i.meal === 'special') {
      specials[i.dish] = (specials[i.dish] || 0) + i.qty
      continue
    }
    meals[i.meal] ??= { dish: i.dish ?? null, qty: 0, ...(people ? { members: [] } : {}) }
    meals[i.meal].qty += i.qty // older orders could have several lines per meal
    if (people) meals[i.meal].members.push(...(i.members ?? []).map(String))
  }
  if (people) {
    for (const [meal, m] of Object.entries(meals)) {
      // Only current members, each once. Older orders have no ticks: start from the members' plans.
      m.members = [...new Set(m.members)].filter((id) => people.some((u) => String(u._id) === id))
      if (!m.members.length) m.members = planEaters(people, meal).slice(0, m.qty)
      m.qty = m.members.length
    }
  }
  return { meals, specials }
}

// The cart as the API wants it: [{ meal, dish, qty, members? }], in a fixed order (so two carts can be compared).
const itemsOf = ({ meals, specials }) => [
  ...MEALS.filter(({ meal }) => meals[meal]?.qty > 0).map(({ meal }) => {
    const { dish, qty, members } = meals[meal]
    return { meal, dish, qty, ...(members ? { members: [...members].sort() } : {}) }
  }),
  ...Object.entries(specials)
    .filter(([, qty]) => qty > 0)
    .sort()
    .map(([dish, qty]) => ({ meal: 'special', dish, qty })),
]

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

/** Veg / Non-veg switch for one meal (only on non-veg days, when both kinds are posted). */
function KindSwitch({ meal, value, options, disabled, onChange }) {
  return (
    <div role="radiogroup" aria-label={`${mealName[meal]}: veg or non-veg`} className="mt-3 grid grid-cols-2 gap-2">
      {KINDS.map(({ food, label, icon: Icon }) => {
        const count = options.filter((d) => (d.food === 'non-veg') === (food === 'non-veg')).length
        const active = value === food
        return (
          <button
            key={food}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || !count}
            onClick={() => onChange(food)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-40 ${
              active
                ? food === 'veg'
                  ? 'border-fresh bg-fresh/10 text-forest'
                  : 'border-[#b4442a] bg-[#b4442a]/10 text-[#b4442a]'
                : 'border-line bg-white'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            <span className="font-normal text-muted">{count ? `(${count})` : '(none)'}</span>
          </button>
        )
      })}
    </div>
  )
}

/** One tick box: on = eating. */
function Tick({ on, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-9 items-center justify-center rounded-lg border-2 transition-colors disabled:cursor-not-allowed ${
        on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-transparent hover:border-forest/50'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <Check className="size-5" strokeWidth={3} aria-hidden="true" />
    </button>
  )
}

/**
 * Group: a member x meal grid of ticks. The owner taps a tick to mark a member in or out, a name for their
 * whole day, or a meal heading for everyone. Other members see it read-only.
 */
function WhoIsEating({ meals, members, cart, me, canChange, onTick }) {
  const isOn = (meal, id) => cart.meals[meal]?.members?.includes(id) ?? false
  const open = meals.filter(({ meal }) => canChange(meal))
  const anyOpen = open.length > 0
  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 font-bold">
        <Users className="size-5 text-fresh" aria-hidden="true" />
        Who’s eating
      </p>
      <p className="mt-0.5 text-sm text-muted">
        {anyOpen
          ? 'Tap ✓ to mark a member in or out. Tap a name for their whole day, or a meal for everyone.'
          : 'Ticked members are eating. Each pays for the tiffins they are ticked for.'}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-1.5 pr-2 text-left font-semibold">Member</th>
              {meals.map(({ meal, label }) => {
                const count = cart.meals[meal]?.members?.length ?? 0
                const allOn = count === members.length
                return (
                  <th key={meal} className="px-1 py-1.5 text-center font-semibold">
                    {canChange(meal) ? (
                      <button
                        type="button"
                        onClick={() =>
                          onTick(
                            meal,
                            members.map((u) => String(u._id)),
                            !allOn,
                          )
                        }
                        className="rounded-md px-1.5 py-0.5 hover:bg-forest/10"
                        title={allOn ? `No one for ${label.toLowerCase()}` : `Everyone for ${label.toLowerCase()}`}
                      >
                        {label}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <Lock className="size-3" aria-label="closed" />
                      </span>
                    )}
                    <span className="block font-normal tabular-nums">
                      {count}/{members.length}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((u) => {
              const id = String(u._id)
              const dayOn = open.length > 0 && open.every(({ meal }) => isOn(meal, id))
              return (
                <tr key={id} className={id === String(me) ? 'bg-forest/5' : ''}>
                  <td className="py-1.5 pr-2">
                    {anyOpen ? (
                      <button
                        type="button"
                        onClick={() => open.forEach(({ meal }) => onTick(meal, [id], !dayOn))}
                        className="text-left font-semibold hover:text-forest"
                        title={dayOn ? 'Mark not eating today' : 'Mark eating every open meal'}
                      >
                        {u.name}
                      </button>
                    ) : (
                      <span className="font-semibold">{u.name}</span>
                    )}
                    {id === String(me) && <span className="text-xs text-muted"> (you)</span>}
                    {u.foodPreference === 'non-veg' && (
                      <span className="block text-xs text-muted">prefers non-veg</span>
                    )}
                  </td>
                  {meals.map(({ meal, label }) => (
                    <td key={meal} className="px-1 py-1.5 text-center">
                      <Tick
                        on={isOn(meal, id)}
                        disabled={!canChange(meal)}
                        onClick={() => onTick(meal, [id], !isOn(meal, id))}
                        label={`${u.name} eats ${label.toLowerCase()}`}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * The daily order ("cart"): for breakfast, lunch and dinner pick ONE of the admin's options (a group: one option
 * for everyone), set how many eat it, add specials, see the bill, place it.
 * On non-veg days (Sun and Wed) each meal also has a Veg / Non-veg switch.
 * In a group only the owner can change the order.
 */
export default function OrderCart({ planKey, onSaved }) {
  const notify = useNotice()
  const { user } = useAuth()
  const [date, setDate] = useState(todayIST())
  const [day, setDay] = useState(null) // everything from GET /orders
  const [cart, setCart] = useState({ meals: {}, specials: {} })
  const [busy, setBusy] = useState(false)

  const groupOf = (data) => (data.account.kind === 'group' ? data.account.members : null)
  const load = (data) => {
    setDay(data)
    setCart(cartFrom(data.order.items, groupOf(data)))
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

  const { account, dishes, prices, cutoffs, locked, order, nonVegDay } = day
  const isGroup = account.kind === 'group'
  const people = Math.max(1, account.people) // most tiffins of one meal: 1 for a person, 1 per member for a group
  const maxSpecials = isGroup ? 100 : 10
  const editable = account.canEdit && (date >= todayIST() || day.anyDay)
  const items = itemsOf(cart)
  const dirty = JSON.stringify(items) !== JSON.stringify(itemsOf(cartFrom(order.items, groupOf(day))))
  const members = account.members ?? []

  const optionsOf = (meal) => dishes.filter((d) => d.meal === meal)
  const priceOf = (meal, dish) => (dish?.price > 0 ? dish.price : prices[meal] || 0)

  // Bill lines with names and prices (a saved line keeps its name if its dish has gone from the menu).
  const lines = items.map((item) => {
    const dish = item.dish && dishes.find((d) => d._id === item.dish)
    const saved = order.items.find((i) => i.meal === item.meal && (i.dish ?? null) === item.dish)
    return {
      ...item,
      key: `${item.meal}|${item.dish ?? ''}`,
      name: dish?.name ?? saved?.name ?? `${mealName[item.meal]} tiffin`,
      price: dish ? priceOf(item.meal, dish) : (saved?.price ?? priceOf(item.meal, null)),
    }
  })
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0)

  const setMeal = (meal, next) =>
    setCart((c) => ({ ...c, meals: { ...c.meals, [meal]: { ...c.meals[meal], ...next } } }))
  const onlyOption = (meal) => (optionsOf(meal).length === 1 ? optionsOf(meal)[0]._id : null)
  // Picking an option for a skipped meal means "we're eating it": 1 tiffin, or the group's usual eaters.
  const pick = (meal, dish) => {
    const now = cart.meals[meal]
    if (!isGroup) return setMeal(meal, { dish: dish._id, qty: now?.qty || 1 })
    const ticked = now?.members?.length ? now.members : planEaters(members, meal)
    setMeal(meal, { dish: dish._id, members: ticked, qty: ticked.length })
  }
  // Group: tick (`on`) or untick these members for a meal.
  const tick = (meal, ids, on) =>
    setCart((c) => {
      const now = c.meals[meal] ?? { dish: null, members: [] }
      const set = new Set(now.members ?? [])
      for (const id of ids) on ? set.add(id) : set.delete(id)
      const ticked = [...set]
      const next = { ...now, dish: now.dish ?? onlyOption(meal), members: ticked, qty: ticked.length }
      return { ...c, meals: { ...c.meals, [meal]: next } }
    })
  const setSpecial = (id, qty) =>
    setCart((c) => ({ ...c, specials: { ...c.specials, [id]: Math.max(0, Math.min(maxSpecials, qty)) } }))

  const place = async () => {
    // A meal with options but none picked would silently become a plain tiffin: ask first.
    const unpicked = MEALS.filter(
      ({ meal }) =>
        cart.meals[meal]?.qty > 0 && !cart.meals[meal].dish && optionsOf(meal).length && !locked.includes(meal),
    )
    if (unpicked.length) return notify(`Pick an option for ${unpicked.map((m) => m.label).join(', ')}.`)
    setBusy(true)
    try {
      const data = await api('/orders', { method: 'PUT', body: { date, items } })
      load(data)
      const closed = data.lockedNow?.filter((m) => items.some((i) => i.meal === m)) ?? []
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

  const specials = optionsOf('special')
  // A meal is shown when it has options or is in the cart (plain tiffin from the plan, menu not posted yet).
  const shown = MEALS.filter(({ meal }) => optionsOf(meal).length || cart.meals[meal])

  return (
    <section className="card p-6" aria-labelledby="cart-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cart-title" className="flex items-center gap-2 text-lg font-extrabold">
          <ShoppingCart className="size-5 text-fresh" aria-hidden="true" />
          {isGroup ? 'Group order' : 'My order'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ...(day.anyDay ? [{ label: 'Yesterday', value: todayIST(-1) }] : []),
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
            min={day.anyDay ? undefined : todayIST()}
            max={day.anyDay ? undefined : addDays(todayIST(), 30)}
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

      <p
        className={`mt-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${nonVegDay ? 'bg-[#b4442a]/5' : 'bg-fresh/5'}`}
      >
        {nonVegDay ? (
          <Drumstick className="mt-0.5 size-4 shrink-0 text-[#b4442a]" aria-hidden="true" />
        ) : (
          <Leaf className="mt-0.5 size-4 shrink-0 text-fresh" aria-hidden="true" />
        )}
        <span>
          {nonVegDay
            ? `Non-veg day: choose Veg or Non-veg for each meal${isGroup ? ', for the whole group' : ''}.`
            : 'Veg only today. Non-veg is served on Sundays and Wednesdays.'}
          {nonVegDay && isGroup && account.canEdit && (
            <>
              {' '}
              {account.nonVegMembers} of {account.people} members prefer non-veg.
            </>
          )}
        </span>
      </p>

      {day.anyDay && (
        <p className="mt-3 rounded-xl border border-dashed border-saffron bg-saffron-soft/40 px-4 py-3 text-sm">
          <strong>Test mode:</strong> you can add or remove tiffins on any day, past days included, with no cut-off
          times. Set <code>ALLOW_ANY_DAY=false</code> in <code>backend/.env</code> before going live.
        </p>
      )}
      {isGroup && (
        <p className="mt-3 rounded-xl bg-forest/5 px-4 py-3 text-sm">
          {account.canEdit
            ? 'You are the owner: pick one option per meal for everyone, then tick who is eating in “Who’s eating”. Each member’s share of the bill follows their ticks.'
            : 'This is your group’s order. Only the group’s owner can change it. Check you are ticked in “Who’s eating”, and ask them if not.'}
        </p>
      )}
      {day.startsOn && !items.length && (
        <p className="mt-3 rounded-xl bg-saffron-soft/60 px-4 py-3 text-sm">
          Daily tiffins start automatically from {formatDate(day.startsOn)}.
          {editable && ' To eat on this day, pick your meals below and place the order.'}
        </p>
      )}

      {shown.length === 0 && specials.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-8 text-center text-muted">
          The menu for {formatDate(date)} isn’t posted yet. Check back soon.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {shown.map(({ meal, label, icon: Icon }) => {
            const isLocked = locked.includes(meal)
            const canChange = editable && !isLocked
            const options = optionsOf(meal)
            const chosen = cart.meals[meal] ?? { dish: null, qty: 0 }
            const chosenDish = options.find((d) => d._id === chosen.dish)
            const savedName = !chosenDish && chosen.dish && lines.find((l) => l.meal === meal)?.name
            const hasNonVeg = nonVegDay && options.some((d) => d.food === 'non-veg')
            // Shown kind: the chosen option's, else veg (or non-veg if that's all there is).
            const kind = chosenDish
              ? chosenDish.food === 'non-veg'
                ? 'non-veg'
                : 'veg'
              : options.some((d) => d.food !== 'non-veg')
                ? 'veg'
                : 'non-veg'
            const only = options.length === 1 ? options[0]._id : null // one option: no need to pick
            const visible = hasNonVeg ? options.filter((d) => (d.food === 'non-veg') === (kind === 'non-veg')) : options
            const switchKind = (food) => {
              const first = options.find((d) => (d.food === 'non-veg') === (food === 'non-veg'))
              if (first) pick(meal, first)
            }
            return (
              <div
                key={meal}
                role="group"
                aria-labelledby={`${meal}-title`}
                className="rounded-2xl border border-line p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p id={`${meal}-title`} className="flex items-center gap-2 font-bold">
                    <Icon className="size-5 text-fresh" aria-hidden="true" />
                    {label}
                    <span className="text-sm font-normal text-muted">
                      {options.length > 1 ? `pick one of ${options.length}` : options.length ? '1 option' : ''}
                    </span>
                  </p>
                  {date === todayIST() && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${isLocked ? 'text-[#b4442a]' : 'text-muted'}`}
                    >
                      {isLocked && <Lock className="size-3.5" aria-hidden="true" />}
                      {isLocked ? `Closed at ${cutoffs[meal]}` : `Order by ${cutoffs[meal]}`}
                    </span>
                  )}
                </div>

                {hasNonVeg && (
                  <KindSwitch meal={meal} value={kind} options={options} disabled={!canChange} onChange={switchKind} />
                )}

                {options.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">
                    Menu not posted yet: standard {label.toLowerCase()} tiffin ({rupees(priceOf(meal, null))}). You can
                    pick an option once it is posted.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {visible.map((d) => {
                      const selected = chosen.dish === d._id && chosen.qty > 0
                      return (
                        <li key={d._id}>
                          <label
                            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                              selected ? 'border-forest bg-forest/5' : 'border-transparent'
                            } ${canChange ? 'cursor-pointer hover:bg-forest/5' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`${meal}-option`}
                              checked={selected}
                              disabled={!canChange}
                              onChange={() => pick(meal, d)}
                              className="size-4 shrink-0 accent-forest"
                            />
                            <div className="min-w-0 flex-1">
                              <DishItem dish={{ ...d, price: priceOf(meal, d) }} showPrice />
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {savedName && <p className="mt-2 text-xs text-muted">Saved: {savedName} (no longer on the menu)</p>}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                  {chosen.qty > 0 ? (
                    <span>
                      {isGroup ? (
                        <>
                          <strong>{chosen.qty}</strong> of {people} eating (ticked below)
                        </>
                      ) : (
                        'You are eating'
                      )}
                      {chosenDish ? (
                        <> · {chosenDish.name}</>
                      ) : options.length && !savedName ? (
                        <span className="font-semibold text-saffron"> · pick an option</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted">Skipping {label.toLowerCase()}</span>
                  )}
                  {canChange && !isGroup && (
                    <button
                      type="button"
                      onClick={() => setMeal(meal, { dish: chosen.dish ?? only, qty: chosen.qty ? 0 : 1 })}
                      className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold hover:border-forest/40"
                    >
                      {chosen.qty ? `Skip ${label.toLowerCase()}` : `Eat ${label.toLowerCase()}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {isGroup && shown.length > 0 && (
            <WhoIsEating
              meals={shown}
              members={members}
              cart={cart}
              me={user?._id}
              canChange={(meal) => editable && !locked.includes(meal)}
              onTick={tick}
            />
          )}

          {specials.length > 0 && (
            <div className="rounded-2xl border border-saffron/50 bg-saffron-soft/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-bold">
                  <Sparkles className="size-5 text-saffron" aria-hidden="true" />
                  Specials <span className="text-sm font-normal text-muted">extras, add any</span>
                </p>
                {date === todayIST() && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${locked.includes('special') ? 'text-[#b4442a]' : 'text-muted'}`}
                  >
                    {locked.includes('special') && <Lock className="size-3.5" aria-hidden="true" />}
                    {locked.includes('special') ? `Closed at ${cutoffs.dinner}` : `Order by ${cutoffs.dinner}`}
                  </span>
                )}
              </div>
              <ul className="mt-3 divide-y divide-line">
                {specials.map((d) => (
                  <li key={d._id} className="py-2.5">
                    <DishItem dish={{ ...d, price: priceOf('special', d) }} showPrice>
                      <Stepper
                        qty={cart.specials[d._id] || 0}
                        max={maxSpecials}
                        disabled={!editable || locked.includes('special')}
                        onChange={(q) => setSpecial(d._id, q)}
                        label={d.name}
                      />
                    </DishItem>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-cream-dark/50 p-4">
        <h3 className="font-bold">Bill for {formatDate(date)}</h3>
        {lines.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing in the cart.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-muted">{mealName[l.meal]}:</span> {l.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {l.qty} × {rupees(l.price)} = <strong>{rupees(l.qty * l.price)}</strong>
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

import { useEffect, useRef, useState } from 'react'
import { ChefHat, Coffee, MessageCircle, Moon, Printer, Sparkles, Sun, User, Users } from 'lucide-react'
import Field, { FormError } from '../../components/account/Field.jsx'
import { api } from '../../lib/api.js'
import useLiveReload from '../../lib/useLiveReload.js'
import { formatDate, rupees, todayIST } from '../../data/accountOptions.js'
import { Stat } from './shared.jsx'
import { useNotice } from '../../components/Notice.jsx'

const meals = [
  { meal: 'breakfast', label: 'Breakfast', icon: Coffee },
  { meal: 'lunch', label: 'Lunch', icon: Sun },
  { meal: 'dinner', label: 'Dinner', icon: Moon },
  { meal: 'special', label: 'Specials', icon: Sparkles },
]

/** "Veg thali ×3, Gulab jamun ×2" */
const itemsText = (items) => items.map((i) => `${i.name} ×${i.qty}`).join(', ')

function OrderRows({ rows, kind }) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="text-xs tracking-wider text-muted uppercase">
        <tr>
          <th className="py-2 pr-3 font-semibold">{kind === 'group' ? 'Group' : 'Name'}</th>
          {meals.map((m) => (
            <th key={m.meal} className="py-2 pr-3 font-semibold">
              {m.label}
            </th>
          ))}
          <th className="py-2 text-right font-semibold">Bill</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => (
          <tr key={r._id} className="align-top">
            <td className="py-2.5 pr-3">
              <span className="font-semibold">{r.name}</span>
              {r.changed && <span className="ml-2 text-xs font-semibold text-saffron">changed</span>}
              <div className="text-xs text-muted">{kind === 'group' ? `${r.people} members` : r.phone}</div>
            </td>
            {meals.map((m) => (
              <td key={m.meal} className="py-2.5 pr-3">
                {itemsText(r.items.filter((i) => i.meal === m.meal)) || <span className="text-muted">–</span>}
              </td>
            ))}
            <td className="py-2.5 text-right font-semibold tabular-nums">{rupees(r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const STATUS = {
  new: { label: 'Waiting for payment', tone: 'bg-saffron-soft text-charcoal' },
  confirmed: { label: 'Confirmed · paid', tone: 'bg-fresh text-white' }, // older orders, until the server moves them
  paid: { label: 'Confirmed · paid', tone: 'bg-fresh text-white' },
  cancelled: { label: 'Cancelled', tone: 'bg-[#b4442a]/10 text-[#b4442a]' },
}
const time = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

/** One non-membership order: once the customer has paid, confirm it with the amount received. */
function GuestRow({ g, onStatus }) {
  const [amount, setAmount] = useState(String(g.amount))
  useEffect(() => setAmount(String(g.amount)), [g.amount])
  const paid = g.status === 'paid' || g.status === 'confirmed'

  return (
    <li className={`py-4 ${g.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {g.name}
            <span className="ml-2 text-xs font-normal text-muted">
              #{g.code} · ordered {time(g.createdAt)}
              {g.paidAt && ` · paid ${time(g.paidAt)}`}
            </span>
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[g.status].tone}`}>
              {STATUS[g.status].label}
            </span>
          </p>
          <p className="mt-1 text-sm">{itemsText(g.items)}</p>
          <p className="mt-1 text-sm text-muted">
            {g.delivery === 'delivery' ? `Deliver to: ${g.address}` : 'Pickup from the mess'}
            {g.note && ` · “${g.note}”`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <a
            href={`https://wa.me/${g.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline min-h-9 px-3 text-sm"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            +{g.phone.slice(0, 2)} {g.phone.slice(2)}
          </a>
          {g.status === 'new' && (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                onStatus(g, 'paid', Number(amount))
              }}
            >
              <label className="flex items-center gap-1 text-sm">
                <span className="text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  aria-label={`Amount ${g.name} paid`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-right tabular-nums"
                />
              </label>
              <button type="submit" className="btn-primary min-h-9 px-3 text-sm">
                Confirm · paid
              </button>
            </form>
          )}
          {paid && (
            <>
              <strong className="text-fresh tabular-nums">{rupees(g.amount)} received</strong>
              <button type="button" onClick={() => onStatus(g, 'new')} className="btn-outline min-h-9 px-3 text-sm">
                Undo
              </button>
            </>
          )}
          {g.status === 'new' && (
            <button type="button" onClick={() => onStatus(g, 'cancelled')} className="btn-outline min-h-9 px-3 text-sm">
              Cancel
            </button>
          )}
          {g.status === 'cancelled' && (
            <button type="button" onClick={() => onStatus(g, 'new')} className="btn-outline min-h-9 px-3 text-sm">
              Undo cancel
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

/** What to cook on a day: kitchen totals per dish, then every group's and person's order. */
export default function OrdersTab({ date, setDate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const notify = useNotice()
  const [tick, setTick] = useState(0)
  // Customers keep placing and changing orders: reload regularly, keeping the list on screen meanwhile.
  useLiveReload(() => setTick((t) => t + 1))

  const shownDate = useRef(date)
  useEffect(() => {
    if (shownDate.current !== date) {
      shownDate.current = date
      setData(null)
    }
    setError('')
    api(`/admin/orders?date=${date}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [date, tick])

  // Totals and the kitchen list change with a WhatsApp order's status, so reload after saving it.
  const setStatus = async (order, status, amount) => {
    if (status === 'cancelled' && !window.confirm(`Cancel ${order.name}'s order #${order.code}?`)) return
    try {
      await api(`/admin/guest-orders/${order._id}`, { method: 'PATCH', body: { status, amount } })
      setTick((t) => t + 1)
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="w-48">
          <Field label="Day" name="ordersDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="button" onClick={() => setDate(todayIST())} className="btn-outline min-h-11 px-4 text-sm">
          Today
        </button>
        <button type="button" onClick={() => setDate(todayIST(1))} className="btn-outline min-h-11 px-4 text-sm">
          Tomorrow
        </button>
        <button type="button" onClick={() => window.print()} className="btn-outline min-h-11 px-4 text-sm">
          <Printer className="size-4" aria-hidden="true" />
          Print
        </button>
      </div>
      <FormError message={error} />
      {!data && !error && <p className="text-muted">Counting tiffins…</p>}

      {data && (
        <>
          <p className="text-muted">
            Orders for <strong className="text-charcoal">{formatDate(data.date)}</strong>
            {data.date > todayIST() ? ' (plans and changes so far; may still change until the cut-off times)' : ''}.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {meals.map((m) => (
              <Stat
                key={m.meal}
                label={m.label}
                value={data.total[m.meal]}
                tone={m.meal === 'special' ? 'text-saffron' : 'text-forest'}
              />
            ))}
            <Stat label="Members' bill" value={rupees(data.amount)} tone="text-charcoal" />
            <Stat label="Non-membership paid" value={rupees(data.guestPaid ?? 0)} tone="text-fresh" />
          </div>

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <ChefHat className="size-5 text-fresh" aria-hidden="true" />
              Kitchen list
            </h3>
            {data.kitchen.length === 0 ? (
              <p className="mt-2 text-muted">No orders for this day.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {meals.map(({ meal, label, icon: Icon }) => {
                  const list = data.kitchen.filter((k) => k.meal === meal)
                  if (!list.length) return null
                  return (
                    <div key={meal} className="rounded-xl bg-cream-dark/50 p-4">
                      <p className="flex items-center gap-2 font-bold">
                        <Icon className="size-4 text-fresh" aria-hidden="true" />
                        {label}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {list.map((k) => (
                          <li key={k.name} className="flex justify-between gap-3">
                            <span>{k.name}</span>
                            <strong className="tabular-nums">× {k.qty}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <MessageCircle className="size-5 text-fresh" aria-hidden="true" />
              Non-membership orders ({(data.guests ?? []).filter((g) => g.status !== 'cancelled').length})
            </h3>
            <ol className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
              <li>
                <strong className="text-charcoal">1.</strong> Order comes in from the home page (WhatsApp)
              </li>
              <li aria-hidden="true">→</li>
              <li>
                <strong className="text-charcoal">2.</strong> Once they have paid, check the amount and tap{' '}
                <em>Confirm · paid</em>
              </li>
            </ol>
            <p className="mt-1 text-xs text-muted">
              Every order that isn’t cancelled is in the kitchen list. Confirmed (paid) orders count as revenue
              everywhere: here, the monthly sheet, the heatmap and the dues.
            </p>
            {!data.guests?.length ? (
              <p className="mt-3 text-muted">No non-membership orders.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {data.guests.map((g) => (
                  <GuestRow key={g._id} g={g} onStatus={setStatus} />
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <Users className="size-5 text-fresh" aria-hidden="true" />
              Groups ({data.groups.length})
            </h3>
            {data.groups.length === 0 ? (
              <p className="mt-2 text-muted">No group orders.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <OrderRows rows={data.groups} kind="group" />
              </div>
            )}
          </section>

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <User className="size-5 text-fresh" aria-hidden="true" />
              Individuals ({data.individuals.length})
            </h3>
            {data.individuals.length === 0 ? (
              <p className="mt-2 text-muted">No individual orders.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <OrderRows rows={data.individuals} kind="user" />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

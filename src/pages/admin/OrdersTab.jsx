import { useEffect, useState } from 'react'
import { ChefHat, Coffee, Moon, Printer, Sparkles, Sun, User, Users } from 'lucide-react'
import Field, { FormError } from '../../components/account/Field.jsx'
import { api } from '../../lib/api.js'
import { formatDate, rupees, todayIST } from '../../data/accountOptions.js'
import { Stat } from './shared.jsx'

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

/** What to cook on a day: kitchen totals per dish, then every group's and person's order. */
export default function OrdersTab({ date, setDate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    setError('')
    api(`/admin/orders?date=${date}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [date])

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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {meals.map((m) => (
              <Stat
                key={m.meal}
                label={m.label}
                value={data.total[m.meal]}
                tone={m.meal === 'special' ? 'text-saffron' : 'text-forest'}
              />
            ))}
            <Stat label="Bill for the day" value={rupees(data.amount)} tone="text-charcoal" />
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

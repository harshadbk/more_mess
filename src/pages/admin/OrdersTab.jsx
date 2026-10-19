import { useEffect, useState } from 'react'
import { Coffee, Moon, Printer, Sparkles, Sun, User, Users } from 'lucide-react'
import Field, { FormError } from '../../components/account/Field.jsx'
import { api } from '../../lib/api.js'
import { formatDate, MEALS, mealLabel, todayIST } from '../../data/accountOptions.js'
import { Stat, Tick } from './shared.jsx'

const mealIcons = { breakfast: Coffee, lunch: Sun, dinner: Moon }

function PeopleTable({ people }) {
  return (
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead className="text-xs tracking-wider text-muted uppercase">
        <tr>
          <th className="py-2 pr-3 font-semibold">Name</th>
          <th className="py-2 pr-3 font-semibold">Phone</th>
          {MEALS.map((m) => (
            <th key={m} className="py-2 pr-3 text-center font-semibold">
              {mealLabel(m)}
            </th>
          ))}
          <th className="py-2 font-semibold">Specials</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {people.map((p) => (
          <tr key={p._id}>
            <td className="py-2 pr-3 font-medium">
              {p.name}
              {p.changed && <span className="ml-2 text-xs font-semibold text-saffron">changed</span>}
            </td>
            <td className="py-2 pr-3 text-muted">{p.phone}</td>
            {MEALS.map((m) => (
              <td key={m} className="py-2 pr-3 text-center">
                <Tick on={p[m]} />
              </td>
            ))}
            <td className="py-2 text-muted">{p.specials.map((s) => `${s.name} ×${s.qty}`).join(', ') || '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Counts({ row }) {
  return (
    <span className="flex gap-4 text-sm">
      {MEALS.map((m) => {
        const Icon = mealIcons[m]
        return (
          <span key={m} className="inline-flex items-center gap-1" title={mealLabel(m)}>
            <Icon className="size-4 text-fresh" aria-hidden="true" />
            <span className="sr-only">{mealLabel(m)}</span>
            <strong>{row[m]}</strong>
          </span>
        )
      })}
      {row.specials > 0 && (
        <span className="inline-flex items-center gap-1" title="Specials">
          <Sparkles className="size-4 text-saffron" aria-hidden="true" />
          <span className="sr-only">Specials</span>
          <strong>{row.specials}</strong>
        </span>
      )}
    </span>
  )
}

/** How many tiffins to make on a day, split by group and individual. */
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
            Tiffins to make on <strong className="text-charcoal">{formatDate(data.date)}</strong>
            {data.date > todayIST() ? ' (from plans and changes so far, may still change)' : ''}.
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {MEALS.map((m) => (
              <Stat key={m} label={mealLabel(m)} value={data.total[m]} />
            ))}
            <Stat label="Specials" value={data.total.specials} tone="text-saffron" />
            <Stat
              label="Total tiffins"
              value={MEALS.reduce((sum, m) => sum + data.total[m], 0) + data.total.specials}
              tone="text-charcoal"
            />
          </div>

          {data.specials.length > 0 && (
            <section className="card p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Sparkles className="size-5 text-saffron" aria-hidden="true" />
                Specials to cook
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.specials.map((s) => (
                  <li key={s.name} className="rounded-full bg-saffron-soft px-4 py-1.5 text-sm font-semibold">
                    {s.name} × {s.qty}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <Users className="size-5 text-fresh" aria-hidden="true" />
              Groups ({data.groups.length})
            </h3>
            {data.groups.length === 0 && <p className="mt-2 text-muted">No groups.</p>}
            <div className="mt-3 divide-y divide-line">
              {data.groups.map((g) => (
                <details key={g._id} className="py-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold">
                      {g.name} <span className="text-sm font-normal text-muted">· {g.members.length} people</span>
                    </span>
                    <Counts row={g} />
                  </summary>
                  <div className="mt-3 overflow-x-auto rounded-xl bg-cream-dark/40 px-4">
                    <PeopleTable people={g.members} />
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <User className="size-5 text-fresh" aria-hidden="true" />
              Individuals ({data.individuals.length})
            </h3>
            {data.individuals.length === 0 ? (
              <p className="mt-2 text-muted">No individual customers.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <PeopleTable people={data.individuals} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

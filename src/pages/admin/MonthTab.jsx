import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { FormError } from '../../components/account/Field.jsx'
import { api } from '../../lib/api.js'
import useLiveReload from '../../lib/useLiveReload.js'
import { rupees, todayIST } from '../../data/accountOptions.js'

// Same greens as the calendar heatmap, light -> dark. Step 0 = nothing that day.
const RAMP = ['#efe7d6', '#a3cfae', '#62a77a', '#2f7d50', '#174d35']
const VIEWS = [
  { id: 'days', label: 'Day by day' },
  { id: 'totals', label: 'Totals' },
]

const tiffinsOf = (cell) => (cell ? cell.breakfast + cell.lunch + cell.dinner : 0)
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = Sunday
const monthLabel = (month) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

// "B L D +1" style text for a day, for tooltips and the CSV.
function cellText(cell) {
  if (!cell) return ''
  const parts = [
    cell.breakfast && `B${cell.breakfast > 1 ? cell.breakfast : ''}`,
    cell.lunch && `L${cell.lunch > 1 ? cell.lunch : ''}`,
    cell.dinner && `D${cell.dinner > 1 ? cell.dinner : ''}`,
    cell.specials && `+${cell.specials}`,
  ].filter(Boolean)
  return parts.join(' ')
}

function downloadCsv(sheet, rows) {
  const head = ['Name', 'Phone', 'Group', ...sheet.dates.map((d) => d.slice(8)), 'Days', 'Breakfast', 'Lunch', 'Dinner']
  head.push('Tiffins', 'Specials', 'Bill (Rs)')
  const lines = [head]
  for (const r of rows) {
    const t = r.totals
    lines.push([
      r.name,
      r.phone ?? '',
      r.group ?? '',
      ...sheet.dates.map((d) => cellText(r.days[d])),
      t.days,
      t.breakfast,
      t.lunch,
      t.dinner,
      t.tiffins,
      t.specials,
      t.amount,
    ])
  }
  const csv = lines.map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `tiffins-${sheet.month}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * The month's register. One row per person, one heatmap cell per day (darker = more tiffins), and their month's
 * totals and bill. It fills in as each day's orders come in.
 * Admin: every customer (default). A group's members: pass `group` to see that group, with each member's share.
 */
export default function MonthTab({ group = null, me = null, refreshKey = 0 }) {
  const [month, setMonth] = useState(todayIST().slice(0, 7))
  const [sheet, setSheet] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('days')
  const [search, setSearch] = useState('')

  const [tick, setTick] = useState(0)
  useLiveReload(() => setTick((t) => t + 1)) // orders come in all day

  // A new month (or group) blanks the sheet; a refresh after an order keeps the old one until the new one arrives.
  const shown = useRef(null)
  useEffect(() => {
    const what = `${group?._id}|${month}`
    if (shown.current !== what) {
      shown.current = what
      setSheet(null)
    }
    setError('')
    api(group ? `/groups/${group._id}/sheet?month=${month}` : `/admin/month?month=${month}`)
      .then(setSheet)
      .catch((err) => setError(err.message))
  }, [month, group, refreshKey, tick])
  const who = group ? 'Member' : 'Customer'
  const bill = group ? 'Share' : 'Bill'

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!sheet) return []
    if (!q) return sheet.rows
    return sheet.rows.filter((r) => [r.name, r.phone, r.group].some((v) => v?.toLowerCase().includes(q)))
  }, [sheet, search])

  const totals = rows.reduce(
    (t, r) => ({
      tiffins: t.tiffins + r.totals.tiffins,
      specials: t.specials + r.totals.specials,
      amount: t.amount + r.totals.amount,
      breakfast: t.breakfast + r.totals.breakfast,
      lunch: t.lunch + r.totals.lunch,
      dinner: t.dinner + r.totals.dinner,
    }),
    { tiffins: 0, specials: 0, amount: 0, breakfast: 0, lunch: 0, dinner: 0 },
  )
  // Non-membership (WhatsApp) orders the admin marked paid: their own table, and part of the month's revenue.
  const guests = sheet?.guests ?? []
  const guestTotal = guests.reduce((s, g) => s + g.amount, 0)
  const max = Math.max(1, ...rows.flatMap((r) => Object.values(r.days).map(tiffinsOf)))
  const level = (n) => (n <= 0 ? 0 : max <= 4 ? Math.min(4, n) : Math.min(4, Math.ceil((n / max) * 4)))
  const today = todayIST()

  return (
    <section className="card p-6" aria-labelledby="month-title">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h3 id="month-title" className="text-lg font-extrabold">
          {group ? `${group.name}: everyone’s tiffins` : 'Monthly sheet'}{' '}
          <span className="text-sm font-normal text-muted">{monthLabel(month)}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            aria-label="Month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
          />
          {!group && (
            <input
              type="search"
              aria-label="Search by name, phone or group"
              placeholder="Search name, phone, group"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
            />
          )}
          <div role="radiogroup" aria-label="View" className="flex rounded-full bg-cream-dark p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={view === v.id}
                onClick={() => setView(v.id)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${view === v.id ? 'bg-forest text-white' : ''}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          {sheet && (
            <>
              <button
                type="button"
                onClick={() => downloadCsv(sheet, rows)}
                className="btn-outline min-h-9 px-3 text-sm"
              >
                <Download className="size-4" aria-hidden="true" />
                CSV
              </button>
              <button type="button" onClick={() => window.print()} className="btn-outline min-h-9 px-3 text-sm">
                <Printer className="size-4" aria-hidden="true" />
                Print
              </button>
            </>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted print:hidden">
        {group
          ? 'Every member’s tiffins this month, from the ticks in the group order, and each member’s share of the bill.'
          : 'Every customer’s tiffins for the month, filled in day by day. Group members count the meals they were ticked for.'}{' '}
        Darker = more tiffins. Hover a day for breakfast / lunch / dinner.
      </p>
      <FormError message={error} />
      {!sheet && !error && <p className="mt-4 text-muted">Loading…</p>}

      {sheet && (
        <>
          <dl className={`mt-4 grid grid-cols-2 gap-3 text-sm ${group ? 'sm:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-6'}`}>
            {[
              [`${who}s`, rows.length],
              ['Tiffins', `${totals.tiffins}`],
              ['B / L / D', `${totals.breakfast} / ${totals.lunch} / ${totals.dinner}`],
              [group ? `${bill}s` : 'Members’ bills', rupees(totals.amount)],
              ...(group
                ? []
                : [
                    ['Non-membership paid', rupees(guestTotal)],
                    ['Total revenue', rupees(totals.amount + guestTotal)],
                  ]),
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-cream-dark/60 px-3 py-2">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-display text-lg font-extrabold text-forest">{value}</dd>
              </div>
            ))}
          </dl>

          {rows.length === 0 ? (
            <p className="mt-6 text-muted">
              {search ? 'No one matches that search.' : `No ${who.toLowerCase()}s yet.`}
            </p>
          ) : view === 'days' ? (
            <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-line">
              <table className="border-separate border-spacing-0 text-xs">
                <thead className="sticky top-0 z-20 bg-cream-dark">
                  <tr>
                    <th className="sticky left-0 z-30 min-w-40 bg-cream-dark px-3 py-2 text-left font-semibold">
                      {who}
                    </th>
                    {sheet.dates.map((d) => (
                      <th
                        key={d}
                        className={`w-8 min-w-8 px-0.5 py-2 text-center font-semibold ${
                          d === today ? 'text-saffron' : weekday(d) === 0 ? 'text-[#b4442a]' : 'text-muted'
                        }`}
                        title={new Date(`${d}T00:00:00`).toDateString()}
                      >
                        {Number(d.slice(8))}
                        <span className="block font-normal">{'SMTWTFS'[weekday(d)]}</span>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-right font-semibold">Tiffins</th>
                    <th className="px-2 py-2 text-right font-semibold">{bill}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="group">
                      <td
                        className={`sticky left-0 z-10 border-t border-line px-3 py-1.5 group-hover:bg-cream ${
                          r._id === String(me) ? 'bg-[#eef6f0]' : 'bg-white'
                        }`}
                      >
                        <span className={`block truncate font-semibold ${r.unticked ? 'text-muted italic' : ''}`}>
                          {r.name}
                        </span>
                        {r._id === String(me) && <span className="block text-muted">you</span>}
                        {!group && r.group && !r.unticked && (
                          <span className="block truncate text-muted">{r.group}</span>
                        )}
                      </td>
                      {sheet.dates.map((d) => {
                        const cell = r.days[d]
                        const n = tiffinsOf(cell)
                        const future = d > sheet.until
                        return (
                          <td key={d} className="border-t border-line p-0.5 text-center">
                            <span
                              className={`flex size-7 items-center justify-center rounded font-semibold tabular-nums ${
                                level(n) >= 3 ? 'text-white' : 'text-charcoal'
                              } ${future ? 'border border-dashed border-line' : ''}`}
                              style={{ background: future ? 'transparent' : RAMP[level(n)] }}
                              title={
                                future
                                  ? 'Not yet'
                                  : cell
                                    ? `${cellText(cell) || 'nothing'} · ${rupees(cell.amount)}`
                                    : 'Nothing'
                              }
                            >
                              {n || (cell?.specials ? '+' : '')}
                            </span>
                          </td>
                        )
                      })}
                      <td className="border-t border-line px-2 py-1.5 text-right font-semibold tabular-nums">
                        {r.totals.tiffins}
                        {r.totals.specials > 0 && <span className="font-normal text-muted"> +{r.totals.specials}</span>}
                      </td>
                      <td className="border-t border-line px-2 py-1.5 text-right font-bold whitespace-nowrap tabular-nums">
                        {rupees(r.totals.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 bg-cream-dark font-semibold">
                  <tr>
                    <td className="sticky left-0 z-30 bg-cream-dark px-3 py-2">Day total</td>
                    {sheet.dates.map((d) => (
                      <td key={d} className="py-2 text-center tabular-nums">
                        {d > sheet.until ? '' : rows.reduce((sum, r) => sum + tiffinsOf(r.days[d]), 0) || '–'}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-right tabular-nums">{totals.tiffins}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">{rupees(totals.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream-dark text-xs tracking-wider text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{who}</th>
                    {!group && <th className="px-3 py-2 font-semibold">Group</th>}
                    <th className="px-3 py-2 text-right font-semibold">Days</th>
                    <th className="px-3 py-2 text-right font-semibold">Breakfast</th>
                    <th className="px-3 py-2 text-right font-semibold">Lunch</th>
                    <th className="px-3 py-2 text-right font-semibold">Dinner</th>
                    <th className="px-3 py-2 text-right font-semibold">Tiffins</th>
                    <th className="px-3 py-2 text-right font-semibold">Specials</th>
                    <th className="px-3 py-2 text-right font-semibold">{bill}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {rows.map((r) => (
                    <tr key={r._id} className={r._id === String(me) ? 'bg-[#eef6f0]' : ''}>
                      <td className={`px-3 py-2 font-semibold ${r.unticked ? 'text-muted italic' : ''}`}>
                        {r.name}
                        {r._id === String(me) && <span className="font-normal text-muted"> (you)</span>}
                        {r.phone && <span className="block text-xs font-normal text-muted">{r.phone}</span>}
                      </td>
                      {!group && <td className="px-3 py-2 text-muted">{r.unticked ? '' : (r.group ?? '–')}</td>}
                      <td className="px-3 py-2 text-right tabular-nums">{r.totals.days}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.totals.breakfast}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.totals.lunch}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.totals.dinner}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.totals.tiffins}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.totals.specials}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">{rupees(r.totals.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-cream-dark/60 font-semibold">
                  <tr>
                    <td className="px-3 py-2" colSpan={group ? 2 : 3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.breakfast}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.lunch}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.dinner}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.tiffins}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.specials}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rupees(totals.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {view === 'days' && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span>Less</span>
              {RAMP.map((c) => (
                <span key={c} className="inline-block size-3.5 rounded" style={{ background: c }} />
              ))}
              <span>More</span>
              <span className="ml-3">Number = tiffins that day · “+” = specials only · dashed = not yet</span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            {group
              ? 'Shares are what each member ate this month (specials split between that day’s eaters). What each member has paid the owner is in “Group payments”.'
              : 'Bills are what each customer ate this month (group members: their share). Payments and dues are in the Dues tab.'}
          </p>

          {!group && (
            <div className="mt-8">
              <h4 className="text-base font-extrabold">
                Non-membership orders (paid){' '}
                <span className="text-sm font-normal text-muted">
                  {guests.length} orders · {rupees(guestTotal)}
                </span>
              </h4>
              <p className="mt-1 text-xs text-muted">
                “Today only” orders from the home page, by people without an account. An order shows here once you
                mark it <em>Payment received</em> in the Orders tab.
              </p>
              {guests.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No paid non-membership orders this month.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-cream-dark text-xs tracking-wider text-muted uppercase">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Day</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Order</th>
                        <th className="px-3 py-2 text-right font-semibold">Tiffins</th>
                        <th className="px-3 py-2 text-right font-semibold">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {guests.map((g) => (
                        <tr key={g._id}>
                          <td className="px-3 py-2 whitespace-nowrap">{Number(g.date.slice(8))} {monthLabel(month).split(' ')[0]}</td>
                          <td className="px-3 py-2">
                            <span className="font-semibold">{g.name}</span>
                            <span className="block text-xs text-muted">
                              #{g.code} · +{g.phone.slice(0, 2)} {g.phone.slice(2)}
                            </span>
                          </td>
                          <td className="px-3 py-2">{g.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{g.tiffins}</td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums">{rupees(g.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-cream-dark/60 font-semibold">
                      <tr>
                        <td className="px-3 py-2" colSpan={3}>
                          Total
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {guests.reduce((s, g) => s + g.tiffins, 0)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{rupees(guestTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

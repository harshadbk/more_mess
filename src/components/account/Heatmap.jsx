import { useMemo, useState } from 'react'
import { addDays, formatDate, rupees, todayIST } from '../../data/accountOptions.js'

// One hue (the site's greens), light -> dark, evenly stepped in lightness. Step 0 = no tiffins.
const RAMP = ['#efe7d6', '#a3cfae', '#62a77a', '#2f7d50', '#174d35']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
const CELL = 13
const GAP = 3

const levelOf = (value, max) => (value <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((value / max) * 4)))

/**
 * Calendar heatmap (GitHub style): one square per day, darker = more tiffins.
 * days: [{ date, tiffins, specials, amount }] from the API.
 * onSelect(date): optional, makes each day clickable.
 */
export default function Heatmap({ days, weeks = 26, showAmount = false, onSelect, unit = 'tiffins' }) {
  const [hover, setHover] = useState(null)
  const [asTable, setAsTable] = useState(false)

  const { columns, months, max, byDate } = useMemo(() => {
    const byDate = new Map(days.map((d) => [d.date, d]))
    const end = todayIST()
    // Start on a Monday so each column is one week (Mon at top).
    let start = addDays(end, -(weeks * 7 - 1))
    const weekday = (new Date(`${start}T00:00:00Z`).getUTCDay() + 6) % 7 // 0 = Monday
    start = addDays(start, -weekday)

    const columns = []
    const months = []
    for (let date = start; date <= end; date = addDays(date, 7)) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const d = addDays(date, i)
        week.push(d <= end ? d : null)
      }
      // Label the column where a new month starts.
      const firstOfMonth = week.find((d) => d && d.endsWith('-01'))
      if (firstOfMonth || columns.length === 0) {
        const label = new Date(`${firstOfMonth ?? date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })
        months.push({ index: columns.length, label })
      }
      columns.push(week)
    }
    const max = Math.max(0, ...days.map((d) => d.tiffins + d.specials))
    return { columns, months, max, byDate }
  }, [days, weeks])

  const valueOf = (date) => {
    const d = byDate.get(date)
    return d ? d.tiffins + d.specials : 0
  }

  const totals = days.reduce(
    (t, d) => ({
      tiffins: t.tiffins + d.tiffins + d.specials,
      days: t.days + (d.tiffins + d.specials > 0 ? 1 : 0),
      amount: t.amount + d.amount,
    }),
    { tiffins: 0, days: 0, amount: 0 },
  )
  const busiest = days.reduce(
    (best, d) => (d.tiffins + d.specials > (best?.value ?? 0) ? { ...d, value: d.tiffins + d.specials } : best),
    null,
  )

  const describe = (date) => {
    const d = byDate.get(date)
    if (!d || d.tiffins + d.specials === 0) return `${formatDate(date)}: no ${unit}`
    const parts = [`${d.tiffins} ${d.tiffins === 1 ? 'tiffin' : 'tiffins'}`]
    if (d.specials) parts.push(`${d.specials} special${d.specials === 1 ? '' : 's'}`)
    if (showAmount) parts.push(rupees(d.amount))
    return `${formatDate(date)}: ${parts.join(', ')}`
  }

  const width = columns.length * (CELL + GAP)

  return (
    <div>
      <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-muted">Total</dt>
          <dd className="font-display text-xl font-extrabold text-forest">
            {totals.tiffins} {unit}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Days with tiffins</dt>
          <dd className="font-display text-xl font-extrabold text-forest">{totals.days}</dd>
        </div>
        {showAmount && (
          <div>
            <dt className="text-muted">Worth</dt>
            <dd className="font-display text-xl font-extrabold text-forest">{rupees(totals.amount)}</dd>
          </div>
        )}
        {busiest && (
          <div>
            <dt className="text-muted">Busiest day</dt>
            <dd className="font-display text-xl font-extrabold text-forest">
              {formatDate(busiest.date)} · {busiest.value}
            </dd>
          </div>
        )}
      </dl>

      {asTable ? (
        <div className="max-h-80 overflow-y-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-cream-dark text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 text-right font-semibold">Tiffins</th>
                <th className="px-3 py-2 text-right font-semibold">Specials</th>
                {showAmount && <th className="px-3 py-2 text-right font-semibold">Amount</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-2">{formatDate(d.date)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.tiffins}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.specials}</td>
                  {showAmount && <td className="px-3 py-2 text-right tabular-nums">{rupees(d.amount)}</td>}
                </tr>
              ))}
              {!days.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted">
                    No tiffins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative overflow-x-auto pb-2">
          <div className="flex gap-2" style={{ minWidth: width + 34 }}>
            <div className="flex flex-col pt-5 text-[10px] text-muted" style={{ gap: GAP }} aria-hidden="true">
              {DAY_LABELS.map((label, i) => (
                <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                  {label}
                </span>
              ))}
            </div>
            <div>
              <div className="relative h-5 text-[10px] text-muted" aria-hidden="true">
                {months.map((m) => (
                  <span key={m.index} className="absolute top-0" style={{ left: m.index * (CELL + GAP) }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="flex" style={{ gap: GAP }} role="grid" aria-label={`${unit} per day`}>
                {columns.map((week, c) => (
                  <div key={c} className="flex flex-col" style={{ gap: GAP }} role="row">
                    {week.map((date, r) => {
                      if (!date) return <span key={r} style={{ width: CELL, height: CELL }} />
                      const level = levelOf(valueOf(date), max)
                      const Tag = onSelect ? 'button' : 'span'
                      return (
                        <Tag
                          key={date}
                          type={onSelect ? 'button' : undefined}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={describe(date)}
                          onClick={onSelect ? () => onSelect(date) : undefined}
                          onPointerEnter={(e) =>
                            setHover({ date, x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop })
                          }
                          onFocus={(e) =>
                            setHover({ date, x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop })
                          }
                          onPointerLeave={() => setHover(null)}
                          onBlur={() => setHover(null)}
                          className={`block rounded-[3px] transition-[outline-color] outline-2 outline-offset-1 outline-transparent hover:outline-charcoal/60 focus-visible:outline-charcoal ${
                            date === todayIST() ? 'ring-1 ring-saffron ring-offset-1' : ''
                          } ${onSelect ? 'cursor-pointer' : ''}`}
                          style={{ width: CELL, height: CELL, background: RAMP[level] }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {hover && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-charcoal px-3 py-1.5 text-xs whitespace-nowrap text-white shadow-lift"
              style={{ left: hover.x + CELL / 2, top: hover.y - 6 }} // cell offsets are relative to this box
            >
              {describe(hover.date)}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5" aria-hidden={asTable}>
          <span>Less</span>
          {RAMP.map((color) => (
            <span
              key={color}
              className="inline-block rounded-[3px]"
              style={{ width: CELL, height: CELL, background: color }}
            />
          ))}
          <span>More</span>
          {max > 0 && <span className="ml-2">(darkest = {max} a day)</span>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="font-semibold text-forest hover:underline"
        >
          {asTable ? 'Show as calendar' : 'Show as table'}
        </button>
      </div>
    </div>
  )
}

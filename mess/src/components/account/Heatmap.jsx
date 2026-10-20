import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, formatDate, rupees, todayIST } from '../../data/accountOptions.js'

// One hue (the site's greens), light -> dark, evenly stepped in lightness. Step 0 = nothing that day.
const RAMP = ['#efe7d6', '#a3cfae', '#62a77a', '#2f7d50', '#174d35']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
const CELL = 13
const GAP = 3

// What the squares count: all tiffins, one meal, or specials.
const VIEWS = [
  { id: 'all', label: 'All meals', of: (d) => d.tiffins },
  { id: 'breakfast', label: 'Breakfast', of: (d) => d.meals?.breakfast ?? 0 },
  { id: 'lunch', label: 'Lunch', of: (d) => d.meals?.lunch ?? 0 },
  { id: 'dinner', label: 'Dinner', of: (d) => d.meals?.dinner ?? 0 },
  { id: 'special', label: 'Specials', of: (d) => d.specials },
]

// Small counts (a person: 0-3 a day) get one shade each; bigger ones (a group, the whole mess) are split in 4.
const levelOf = (value, max) => {
  if (value <= 0 || max <= 0) return 0
  return max <= 4 ? value : Math.min(4, Math.ceil((value / max) * 4))
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Calendar heatmap (GitHub style): one square per day, darker = more tiffins.
 * days: [{ date, tiffins, specials, amount, meals: { breakfast, lunch, dinner }, nonVeg }] from the API.
 * since: optional 'YYYY-MM-DD'; days before it are drawn as outlines (not counted as missed).
 * onSelect(date): optional, makes each day clickable.
 */
export default function Heatmap({ days, weeks = 26, showAmount = false, onSelect, since = '' }) {
  const [hover, setHover] = useState(null)
  const [asTable, setAsTable] = useState(false)
  const [view, setView] = useState('all')
  const scrollRef = useRef(null)
  const valueOf = VIEWS.find((v) => v.id === view).of
  const end = todayIST()

  const { columns, months, start } = useMemo(() => {
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
        // A label needs ~3 columns of room; if the previous one is too close, this (real) month start wins.
        if (months.length && columns.length - months.at(-1).index < 3) months.pop()
        months.push({ index: columns.length, label })
      }
      columns.push(week)
    }
    return { columns, months, start }
  }, [end, weeks])

  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days])
  // Only days on the calendar (and after `since`) count in the numbers.
  const counted = useMemo(
    () => days.filter((d) => d.date >= start && d.date <= end && (!since || d.date >= since)),
    [days, start, end, since],
  )
  const max = Math.max(0, ...counted.map(valueOf))

  // Phones show only part of the calendar: start scrolled to the latest weeks.
  useEffect(() => {
    const box = scrollRef.current
    if (box) box.scrollLeft = box.scrollWidth
  }, [asTable, columns.length])

  const firstDay = since && since > start ? since : start
  const daysOnCalendar = firstDay > end ? 0 : Math.round((new Date(end) - new Date(firstDay)) / 86400000) + 1
  const total = counted.reduce((sum, d) => sum + valueOf(d), 0)
  const daysWith = counted.filter((d) => valueOf(d) > 0).length
  const amount = counted.reduce((sum, d) => sum + d.amount, 0)
  const busiest = counted.reduce((best, d) => (valueOf(d) > (best ? valueOf(best) : 0) ? d : best), null)
  const unit = view === 'special' ? 'special' : 'tiffin'

  // Tooltip / screen reader text for one day, e.g. "Sun 19 Oct: Lunch 6 · Dinner 5 (4 non-veg), 2 specials, ₹900".
  const describe = (date) => {
    if (since && date < since) return `${formatDate(date)}: before your tiffins started`
    const d = byDate.get(date)
    if (!d || d.tiffins + d.specials === 0) return `${formatDate(date)}: nothing`
    const meals = d.meals
      ? VIEWS.slice(1, 4)
          .filter((v) => v.of(d) > 0)
          .map((v) => `${v.label} ${v.of(d)}`)
          .join(' · ')
      : plural(d.tiffins, 'tiffin')
    const parts = [meals + (d.nonVeg ? ` (${d.nonVeg} non-veg)` : '')].filter(Boolean)
    if (d.specials) parts.push(plural(d.specials, 'special'))
    if (showAmount) parts.push(rupees(d.amount))
    return `${formatDate(date)}: ${parts.join(', ')}`
  }

  const showHover = (date) => (e) => {
    const el = e.currentTarget
    setHover({ date, x: el.offsetLeft, y: el.offsetTop, width: el.offsetParent?.scrollWidth ?? 0 })
  }

  const width = columns.length * (CELL + GAP)
  const tableRows = [...counted].filter((d) => d.tiffins + d.specials > 0).reverse()

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="What to show">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={view === v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              view === v.id ? 'bg-forest text-white' : 'bg-cream-dark text-charcoal hover:bg-forest/10'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
        <div>
          <dt className="text-muted">{view === 'all' ? 'Tiffins' : VIEWS.find((v) => v.id === view).label}</dt>
          <dd className="font-display text-xl font-extrabold text-forest">{total}</dd>
        </div>
        <div>
          <dt className="text-muted">Days</dt>
          <dd className="font-display text-xl font-extrabold text-forest">
            {daysWith}
            <span className="text-sm font-semibold text-muted"> of {daysOnCalendar}</span>
          </dd>
        </div>
        {showAmount && view === 'all' && (
          <div>
            <dt className="text-muted">Worth</dt>
            <dd className="font-display text-xl font-extrabold text-forest">{rupees(amount)}</dd>
          </div>
        )}
        {busiest && (
          <div>
            <dt className="text-muted">Most in a day</dt>
            <dd className="font-display text-xl font-extrabold text-forest">
              {valueOf(busiest)} <span className="text-sm font-semibold text-muted">{formatDate(busiest.date)}</span>
            </dd>
          </div>
        )}
      </dl>

      {asTable ? (
        <div className="max-h-80 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-cream-dark text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 text-right font-semibold" title="Breakfast">
                  B
                </th>
                <th className="px-3 py-2 text-right font-semibold" title="Lunch">
                  L
                </th>
                <th className="px-3 py-2 text-right font-semibold" title="Dinner">
                  D
                </th>
                <th className="px-3 py-2 text-right font-semibold">Non-veg</th>
                <th className="px-3 py-2 text-right font-semibold">Specials</th>
                {showAmount && <th className="px-3 py-2 text-right font-semibold">Amount</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {tableRows.map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(d.date)}
                        className="font-semibold text-forest hover:underline"
                      >
                        {formatDate(d.date)}
                      </button>
                    ) : (
                      formatDate(d.date)
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.meals?.breakfast || '–'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.meals?.lunch || '–'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.meals?.dinner || '–'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.nonVeg || '–'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.specials || '–'}</td>
                  {showAmount && <td className="px-3 py-2 text-right tabular-nums">{rupees(d.amount)}</td>}
                </tr>
              ))}
              {!tableRows.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    No tiffins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={scrollRef} className="relative overflow-x-auto pt-8 pb-2">
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
              <div className="flex" style={{ gap: GAP }} role="grid" aria-label={`${unit}s per day`}>
                {columns.map((week, c) => (
                  <div key={c} className="flex flex-col" style={{ gap: GAP }} role="row">
                    {week.map((date, r) => {
                      if (!date) return <span key={r} style={{ width: CELL, height: CELL }} />
                      const before = since && date < since
                      const d = byDate.get(date)
                      const level = before || !d ? 0 : levelOf(valueOf(d), max)
                      const Tag = onSelect && !before ? 'button' : 'span'
                      return (
                        <Tag
                          key={date}
                          type={Tag === 'button' ? 'button' : undefined}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={describe(date)}
                          onClick={Tag === 'button' ? () => onSelect(date) : undefined}
                          onPointerEnter={showHover(date)}
                          onFocus={showHover(date)}
                          onPointerLeave={() => setHover(null)}
                          onBlur={() => setHover(null)}
                          className={`block rounded-[3px] transition-[outline-color] outline-2 outline-offset-1 outline-transparent hover:outline-charcoal/60 focus-visible:outline-charcoal ${
                            date === end ? 'ring-1 ring-saffron ring-offset-1' : ''
                          } ${before ? 'border border-dashed border-line' : ''} ${Tag === 'button' ? 'cursor-pointer' : ''}`}
                          style={{ width: CELL, height: CELL, background: before ? 'transparent' : RAMP[level] }}
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
              className={`pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-charcoal px-3 py-1.5 text-xs whitespace-nowrap text-white shadow-lift ${
                hover.x < 140 ? '' : hover.x > hover.width - 140 ? '-translate-x-full' : '-translate-x-1/2'
              }`}
              // cell offsets are relative to this box; near an edge the tooltip is pinned so it isn't cut off
              style={{
                left: hover.x < 140 ? hover.x : hover.x > hover.width - 140 ? hover.x + CELL : hover.x + CELL / 2,
                top: hover.y - 6,
              }}
            >
              {describe(hover.date)}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        {!asTable && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Less</span>
            {RAMP.map((color) => (
              <span
                key={color}
                className="inline-block rounded-[3px]"
                style={{ width: CELL, height: CELL, background: color }}
              />
            ))}
            <span>More</span>
            {max > 0 && (
              <span className="ml-1">
                ({max <= 4 ? 'each shade = 1 more' : `darkest = ${Math.floor((max * 3) / 4) + 1}–${max} a day`})
              </span>
            )}
            {since && (
              <>
                <span
                  className="ml-3 inline-block rounded-[3px] border border-dashed border-line"
                  style={{ width: CELL, height: CELL }}
                />
                <span>before you started</span>
              </>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="ml-auto font-semibold text-forest hover:underline"
        >
          {asTable ? 'Show as calendar' : 'Show as table'}
        </button>
      </div>
    </div>
  )
}

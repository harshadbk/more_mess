import { useEffect, useState } from 'react'
import { MessageCircle, User, Users } from 'lucide-react'
import { FormError } from '../../components/account/Field.jsx'
import { api } from '../../lib/api.js'
import { businessConfig } from '../../data/businessConfig.js'
import { rupees } from '../../data/accountOptions.js'
import { Stat } from './shared.jsx'

/** WhatsApp link to remind someone about their pending amount. */
const reminderUrl = (row) =>
  `https://wa.me/91${row.phone}?text=${encodeURIComponent(
    `Namaste ${row.name}, your pending amount at ${businessConfig.name} is ${rupees(row.pending)} ` +
      `(${row.daysTaken} days, ${row.tiffins} tiffins). Please pay when convenient. Thank you!`,
  )}`

/** What every group and individual has eaten, paid and still owes. */
export default function DuesTab() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/dues')
      .then(({ dues }) => setRows([...dues].sort((a, b) => b.pending - a.pending)))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <FormError message={error} />
  if (!rows) return <p className="text-muted">Working out dues…</p>

  const sum = (key) => rows.reduce((total, r) => total + r[key], 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total charges" value={rupees(sum('charges'))} />
        <Stat label="Total paid (agreed)" value={rupees(sum('paid'))} tone="text-fresh" />
        <Stat
          label="Total pending"
          value={rupees(rows.reduce((t, r) => t + Math.max(0, r.pending), 0))}
          tone="text-[#b4442a]"
        />
      </div>
      <p className="text-sm text-muted">
        Charges = every tiffin up to today at that day's price, plus specials. Paid counts only payments both sides
        agreed. Groups include their members' own payments.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-cream-dark/50 text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Who</th>
              <th className="px-4 py-3 text-right font-semibold">Days</th>
              <th className="px-4 py-3 text-right font-semibold">Tiffins</th>
              <th className="px-4 py-3 text-right font-semibold">Charges</th>
              <th className="px-4 py-3 text-right font-semibold">Paid</th>
              <th className="px-4 py-3 text-right font-semibold">Pending</th>
              <th className="px-4 py-3">
                <span className="sr-only">Remind</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    {r.type === 'group' ? (
                      <Users className="size-4 text-fresh" aria-label="Group" />
                    ) : (
                      <User className="size-4 text-muted" aria-label="Individual" />
                    )}
                    {r.name}
                  </span>
                  <span className="text-xs text-muted">
                    {r.type === 'group' ? `${r.people} people` : r.phone}
                    {r.group && ` · own bill, now in ${r.group}`}
                    {r.active === false && ' · left mess'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.daysTaken}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.tiffins}
                  {r.specials > 0 && <span className="text-muted"> +{r.specials}</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{rupees(r.charges)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{rupees(r.paid)}</td>
                <td
                  className={`px-4 py-3 text-right font-bold tabular-nums ${
                    r.pending > 0 ? 'text-[#b4442a]' : 'text-fresh'
                  }`}
                >
                  {r.pending < 0 ? `${rupees(-r.pending)} advance` : rupees(r.pending)}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.type === 'individual' && r.pending > 0 && (
                    <a
                      href={reminderUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-fresh hover:bg-fresh/10"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Remind
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

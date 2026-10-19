import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { api } from '../../lib/api.js'
import { rupees } from '../../data/accountOptions.js'

function Card({ label, value, note, tone = 'text-forest' }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${tone}`}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  )
}

/** Days taken, tiffins, charges, paid and pending. `refreshKey` reloads it after changes. */
export default function AccountSummary({ refreshKey }) {
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/orders/account')
      .then(setAccount)
      .catch((err) => setError(err.message))
  }, [refreshKey])

  if (error) return <p className="text-sm text-[#b4442a]">{error}</p>
  if (!account) return <p className="text-muted">Loading your account…</p>

  const { me, group } = account
  // In a group, the group pays together, so the group's pending is the one that matters.
  const pending = group ? group.pending : me.pending

  return (
    <section aria-label="My account" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card label="Days taken" value={me.daysTaken} />
        <Card label="Tiffins" value={me.tiffins} note={me.specials ? `+ ${me.specials} specials` : null} />
        <Card label="My charges" value={rupees(me.charges)} />
        <Card label="Paid" value={rupees(group ? group.paid : me.paid)} note={group ? 'by the group' : null} />
        <Card
          label={pending < 0 ? 'Advance' : 'Pending'}
          value={rupees(Math.abs(pending))}
          note={group ? 'for the whole group' : null}
          tone={pending > 0 ? 'text-[#b4442a]' : 'text-fresh'}
        />
      </div>
      {group && (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <Users className="size-4 text-fresh" aria-hidden="true" />
          Group “{group.name}”: {group.tiffins} tiffins, charges {rupees(group.charges)}, paid {rupees(group.paid)}.
        </p>
      )}
    </section>
  )
}

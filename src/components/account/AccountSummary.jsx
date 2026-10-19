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
  // In a group the group pays together: its bill is the main one. "me" = my own bill (eating alone).
  const main = group ?? me
  const pending = main.pending
  const ownBill = group && (me.charges > 0 || me.paid > 0)

  return (
    <section aria-label="My account" className="space-y-3">
      {group && (
        <p className="flex items-center gap-2 text-sm font-semibold text-forest">
          <Users className="size-4" aria-hidden="true" />
          Group “{group.name}” · {group.people} members · one shared bill
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <Card label="Days taken" value={main.daysTaken} />
        <Card label="Tiffins" value={main.tiffins} note={main.specials ? `+ ${main.specials} specials` : null} />
        <Card label={group ? 'Group bill' : 'My bill'} value={rupees(main.charges)} />
        <Card label="Paid" value={rupees(main.paid)} note="agreed by both sides" />
        <Card
          label={pending < 0 ? 'Advance' : 'Pending'}
          value={rupees(Math.abs(pending))}
          tone={pending > 0 ? 'text-[#b4442a]' : 'text-fresh'}
        />
      </div>
      {ownBill && (
        <p className="text-sm text-muted">
          My own bill (from before I joined the group): {me.tiffins} tiffins, {rupees(me.charges)}, paid{' '}
          {rupees(me.paid)}, {me.pending > 0 ? `pending ${rupees(me.pending)}` : 'settled'}.
        </p>
      )}
    </section>
  )
}

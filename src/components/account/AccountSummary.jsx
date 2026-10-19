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

// Days taken, tiffins, bill, paid and pending for one summary.
function Cards({ s, billLabel, paidNote, pendingLabel = 'Pending' }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
      <Card label="Days taken" value={s.daysTaken} />
      <Card label="Tiffins" value={s.tiffins} note={s.specials ? `+ ${s.specials} specials` : null} />
      <Card label={billLabel} value={rupees(s.charges)} />
      <Card label="Paid" value={rupees(s.paid)} note={paidNote} />
      <Card
        label={s.pending < 0 ? 'Advance' : pendingLabel}
        value={rupees(Math.abs(s.pending))}
        tone={s.pending > 0 ? 'text-[#b4442a]' : 'text-fresh'}
      />
    </div>
  )
}

/**
 * Days taken, tiffins, bill, paid and pending. `refreshKey` reloads it after changes.
 * A group's owner sees the whole group's bill with the mess; other members see their own share.
 */
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
  const ownBill = group && (me.charges > 0 || me.paid > 0)

  return (
    <section aria-label="My account" className="space-y-3">
      {group?.isOwner ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-forest">
            <Users className="size-4" aria-hidden="true" />
            Group “{group.name}” · {group.people} members · whole group’s bill with Sai Mess (you pay it)
          </p>
          <Cards s={group} billLabel="Group bill" paidNote="agreed by both sides" />
          <p className="text-sm text-muted">
            Your own share: {group.myShare.tiffins} tiffins, {rupees(group.myShare.charges)}. See what each member owes
            you in “Group payments”.
          </p>
        </>
      ) : group ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-forest">
            <Users className="size-4" aria-hidden="true" />
            Group “{group.name}” · your share · you pay the group’s owner
          </p>
          <Cards s={group.myShare} billLabel="My share" paidNote="to the group’s owner" pendingLabel="Still to pay" />
        </>
      ) : (
        <Cards s={me} billLabel="My bill" paidNote="agreed by both sides" />
      )}
      {ownBill && (
        <p className="text-sm text-muted">
          My own bill (from before I joined the group): {me.tiffins} tiffins, {rupees(me.charges)}, paid{' '}
          {rupees(me.paid)}, {me.pending > 0 ? `pending ${rupees(me.pending)}` : 'settled'}.
        </p>
      )}
    </section>
  )
}

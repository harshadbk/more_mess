import { useEffect, useState } from 'react'
import { Crown, IndianRupee, Trash2 } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useNotice } from '../Notice.jsx'
import { FormError, inputClass } from './Field.jsx'
import { formatDate, rupees, todayIST } from '../../data/accountOptions.js'

const monthLabel = (month) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

// "₹200 due" / "₹50 advance" / "Settled"
function Due({ value }) {
  if (value > 0) return <span className="font-bold text-[#b4442a]">{rupees(value)} due</span>
  if (value < 0) return <span className="font-semibold text-fresh">{rupees(-value)} advance</span>
  return <span className="font-semibold text-fresh">Settled</span>
}

/** Owner: "Rahul paid me ₹500 on …". */
function RecordForm({ member, base, onDone, onCancel }) {
  const notify = useNotice()
  const [values, setValues] = useState({
    amount: member.due > 0 ? String(member.due) : '',
    paidOn: todayIST(),
    note: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!(Number(values.amount) > 0)) return setError('Enter the amount.')
    setBusy(true)
    setError('')
    try {
      await api(`${base}/ledger`, { method: 'POST', body: { ...values, member: member._id } })
      notify(`Saved: ${member.name} paid ${rupees(values.amount)}.`)
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-xl bg-cream-dark/50 p-3" noValidate>
      <FormError message={error} />
      <div className="grid gap-2 sm:grid-cols-[8rem_10rem_1fr]">
        <input
          className={inputClass(false)}
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="₹"
          aria-label={`Amount ${member.name} paid`}
          value={values.amount}
          onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
        />
        <input
          className={inputClass(false)}
          type="date"
          max={todayIST()}
          aria-label="Paid on"
          value={values.paidOn}
          onChange={(e) => setValues((v) => ({ ...v, paidOn: e.target.value }))}
        />
        <input
          className={inputClass(false)}
          placeholder="Note (optional), e.g. UPI"
          aria-label="Note"
          maxLength={120}
          value={values.note}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary min-h-10 px-5 text-sm" disabled={busy}>
          {busy ? 'Saving…' : 'Save payment'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline min-h-10 px-4 text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * Money inside a group, month by month. The owner pays the mess for everyone, so here they see what each member
 * ate (from the ticks in the group order), their share, what they paid the owner, and what they still owe,
 * and record payments. Other members see only their own row.
 */
export default function GroupLedger({ group, refreshKey, onChange }) {
  const notify = useNotice()
  const [month, setMonth] = useState(todayIST().slice(0, 7))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(null) // member id
  const [reload, setReload] = useState(0)
  const base = `/groups/${group._id}`

  useEffect(() => {
    setError('')
    api(`${base}/ledger?month=${month}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [base, month, refreshKey, reload])

  const changed = () => {
    setRecording(null)
    setReload((k) => k + 1)
    onChange?.()
  }

  const remove = async (entry, name) => {
    if (!window.confirm(`Remove ${name}'s payment of ${rupees(entry.amount)}?`)) return
    try {
      await api(`${base}/ledger/${entry._id}`, { method: 'DELETE' })
      changed()
    } catch (err) {
      notify(err.message)
    }
  }

  const owner = data?.canEdit
  const nameOf = (id) => data?.members.find((m) => m._id === String(id))?.name ?? 'Member'
  // The owner pays the mess, so only the other members' payments and dues count here.
  const totals = data?.members.reduce(
    (t, m) => ({
      share: t.share + m.share,
      paid: t.paid + (m.owner ? 0 : m.paid),
      due: t.due + (m.owner ? 0 : Math.max(0, m.due)),
    }),
    { share: 0, paid: 0, due: 0 },
  )

  return (
    <section className="card p-6" aria-labelledby="ledger-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ledger-title" className="flex items-center gap-2 text-lg font-extrabold">
          <IndianRupee className="size-5 text-fresh" aria-hidden="true" />
          {owner ? 'Group payments' : 'My payments to the group'}
        </h2>
        <input
          type="month"
          aria-label="Month"
          max={todayIST().slice(0, 7)}
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
        />
      </div>
      <p className="mt-1 text-sm text-muted">
        {owner
          ? `You pay Sai Mess for the whole group. Each member's share comes from the days they were ticked in “Who’s eating” (specials are split between that day's eaters). Record what they pay you.`
          : 'Your group’s owner pays Sai Mess for everyone. Your share comes from the meals you were ticked for. Pay the owner; they record it here.'}
      </p>
      <FormError message={error} />
      {!data && !error && <p className="mt-4 text-muted">Loading…</p>}

      {data && (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-dark text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 text-right font-semibold">Days</th>
                  <th className="px-3 py-2 text-right font-semibold">Tiffins</th>
                  <th className="px-3 py-2 text-right font-semibold">Share</th>
                  <th className="px-3 py-2 text-right font-semibold">Paid</th>
                  <th className="px-3 py-2 text-right font-semibold">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {data.members.map((m) => (
                  <tr key={m._id} className="align-top">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {m.name}
                        {m.owner && <Crown className="size-3.5 text-saffron" aria-label="Group owner" />}
                        {!m.current && <span className="text-xs font-normal text-muted">(left)</span>}
                      </span>
                      {owner && m.current && !m.owner && recording !== m._id && (
                        <button
                          type="button"
                          onClick={() => setRecording(m._id)}
                          className="text-xs font-semibold text-forest hover:underline"
                        >
                          + Record payment
                        </button>
                      )}
                      {recording === m._id && (
                        <RecordForm member={m} base={base} onDone={changed} onCancel={() => setRecording(null)} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.days}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.tiffins}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rupees(m.share)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.owner ? '–' : rupees(m.paid)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                      {m.owner ? <span className="text-muted">pays mess</span> : <Due value={m.due} />}
                    </td>
                  </tr>
                ))}
                {owner && data.members.length > 1 && (
                  <tr className="bg-cream-dark/40 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums">
                      {data.members.reduce((sum, m) => sum + m.tiffins, 0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{rupees(totals.share)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{rupees(totals.paid)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#b4442a]">
                      {totals.due > 0 ? `${rupees(totals.due)} due` : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            Days, tiffins, share and paid are for {monthLabel(month)}. “Overall” is across all months.
          </p>
          {owner && data.unassigned > 0 && (
            <p className="mt-2 rounded-xl bg-saffron-soft/60 px-3 py-2 text-sm">
              {rupees(data.unassigned)} this month is from older orders where nobody was ticked, so it isn’t in anyone’s
              share.
            </p>
          )}

          <h3 className="mt-5 text-sm font-bold">Payments in {monthLabel(month)}</h3>
          {data.entries.length === 0 ? (
            <p className="mt-1 text-sm text-muted">None yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line text-sm">
              {data.entries.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    {owner && <strong>{nameOf(p.member)} · </strong>}
                    {formatDate(p.paidOn)}
                    {p.note && <span className="text-muted"> · {p.note}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <strong className="tabular-nums">{rupees(p.amount)}</strong>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => remove(p, nameOf(p.member))}
                        className="rounded-full p-1.5 text-[#b4442a] hover:bg-[#b4442a]/10"
                        aria-label="Remove this payment"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

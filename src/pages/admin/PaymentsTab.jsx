import { useEffect, useState } from 'react'
import Field, { FormError } from '../../components/account/Field.jsx'
import PaymentList, { agreedTotal, paymentStatus } from '../../components/account/PaymentList.jsx'
import { useNotice } from '../../components/Notice.jsx'
import { api } from '../../lib/api.js'
import { rupees, todayIST } from '../../data/accountOptions.js'
import { Stat } from './shared.jsx'

function AddPaymentForm({ users, groups, onAdded }) {
  const notify = useNotice()
  const [values, setValues] = useState({ payer: '', amount: '', paidOn: todayIST(), note: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!values.payer) return setError('Choose who paid.')
    if (!(Number(values.amount) > 0)) return setError('Enter the amount paid.')
    const [kind, id] = values.payer.split(':')
    setBusy(true)
    setError('')
    try {
      const { payment } = await api('/payments', {
        method: 'POST',
        body: {
          amount: values.amount,
          paidOn: values.paidOn,
          note: values.note,
          ...(kind === 'group' ? { groupId: id } : { userId: id }),
        },
      })
      onAdded(payment)
      setValues((v) => ({ ...v, amount: '', note: '' }))
      notify(`${rupees(payment.amount)} recorded for ${payment.payerName}. They will be asked to confirm.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h3 className="text-lg font-extrabold">Mark as paid</h3>
      <FormError message={error} />
      <Field label="Paid by" name="payer" as="select" value={values.payer} onChange={set('payer')}>
        <option value="">Choose a group or person…</option>
        <optgroup label="Groups">
          {groups.map((g) => (
            <option key={g._id} value={`group:${g._id}`}>
              {g.name} ({g.members.length} people)
            </option>
          ))}
        </optgroup>
        <optgroup label="People">
          {users
            .filter((u) => u.role === 'user')
            .map((u) => (
              <option key={u._id} value={`user:${u._id}`}>
                {u.name} · {u.phone}
              </option>
            ))}
        </optgroup>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount (₹)"
          name="adminAmount"
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="2000"
          value={values.amount}
          onChange={set('amount')}
        />
        <Field label="Paid on" name="adminPaidOn" type="date" value={values.paidOn} onChange={set('paidOn')} />
      </div>
      <Field
        label="Note (optional)"
        name="adminNote"
        placeholder="e.g. Cash, October"
        value={values.note}
        onChange={set('note')}
      />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : 'Mark as paid'}
      </button>
    </form>
  )
}

/** Record payments for a group or person, and confirm the ones customers add. */
export default function PaymentsTab({ users, groups }) {
  const [payments, setPayments] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    api('/payments')
      .then(({ payments }) => setPayments(payments))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <FormError message={error} />
  if (!payments) return <p className="text-muted">Loading payments…</p>

  const shown = payments.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'confirm') return paymentStatus(p, 'admin').needsMe
    return p.group === filter || p.user === filter
  })
  const needsMe = payments.filter((p) => paymentStatus(p, 'admin').needsMe).length
  const waiting = payments.filter((p) => !p.rejected && p.adminConfirmed && !p.customerConfirmed).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Agreed total" value={rupees(agreedTotal(payments))} />
        <Stat label="You need to confirm" value={needsMe} tone="text-saffron" />
        <Stat label="Waiting for customer" value={waiting} tone="text-muted" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <AddPaymentForm users={users} groups={groups} onAdded={(p) => setPayments((list) => [p, ...list])} />
        <div className="space-y-4">
          <div className="max-w-xs">
            <Field
              label="Show"
              name="paymentFilter"
              as="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All payments</option>
              <option value="confirm">Needs my confirmation</option>
              <optgroup label="Groups">
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="People">
                {users
                  .filter((u) => u.role === 'user')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
              </optgroup>
            </Field>
          </div>
          {filter !== 'all' && filter !== 'confirm' && (
            <p className="text-sm text-muted">
              Agreed total for this payer: <strong className="text-forest">{rupees(agreedTotal(shown))}</strong>
            </p>
          )}
          <PaymentList
            payments={shown}
            side="admin"
            showPayer
            onChange={(p) => setPayments((list) => list.map((x) => (x._id === p._id ? p : x)))}
          />
        </div>
      </div>
    </div>
  )
}

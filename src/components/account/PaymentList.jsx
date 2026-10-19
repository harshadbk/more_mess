import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useNotice } from '../Notice.jsx'
import { formatDate, rupees } from '../../data/accountOptions.js'

/** Where a payment stands, from the point of view of `side` ('admin' or 'customer'). */
export function paymentStatus(p, side) {
  if (p.rejected) return { label: 'Rejected', tone: 'bg-[#b4442a]/10 text-[#b4442a]' }
  if (p.adminConfirmed && p.customerConfirmed) return { label: 'Agreed', tone: 'bg-fresh/10 text-fresh' }
  const mine = side === 'admin' ? p.adminConfirmed : p.customerConfirmed
  if (!mine) return { label: 'Please confirm', tone: 'bg-saffron-soft text-charcoal', needsMe: true }
  return {
    label: side === 'admin' ? 'Waiting for customer' : 'Waiting for Sai Mess',
    tone: 'bg-cream-dark text-muted',
  }
}

/** Sum of payments both sides agreed on. */
export const agreedTotal = (payments) =>
  payments.filter((p) => p.adminConfirmed && p.customerConfirmed && !p.rejected).reduce((sum, p) => sum + p.amount, 0)

export default function PaymentList({ payments, side, onChange, showPayer = false }) {
  const notify = useNotice()
  const [busyId, setBusyId] = useState(null)

  const decide = async (payment, action) => {
    const question =
      action === 'confirm'
        ? `Confirm that ${rupees(payment.amount)} was paid on ${formatDate(payment.paidOn)}?`
        : `Reject this payment of ${rupees(payment.amount)}?`
    if (!window.confirm(question)) return
    setBusyId(payment._id)
    try {
      const data = await api(`/payments/${payment._id}/${action}`, { method: 'POST' })
      onChange(data.payment)
      notify(action === 'confirm' ? 'Payment confirmed. Both sides have agreed.' : 'Payment rejected.')
    } catch (err) {
      notify(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (!payments.length) return <p className="card p-6 text-muted">No payments recorded yet.</p>

  return (
    <ul className="card divide-y divide-line">
      {payments.map((p) => {
        const status = paymentStatus(p, side)
        return (
          <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold">
                {rupees(p.amount)}
                {showPayer && <span className="ml-2 text-base font-semibold text-charcoal">{p.payerName}</span>}
                {showPayer && (
                  <span className="ml-1.5 text-xs font-normal text-muted">{p.group ? '(group)' : '(individual)'}</span>
                )}
              </p>
              <p className="text-sm text-muted">
                Paid {formatDate(p.paidOn)} · added by {p.addedBy === 'admin' ? 'Sai Mess' : 'customer'}
                {p.note && ` · ${p.note}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
              {status.needsMe && (
                <>
                  <button
                    type="button"
                    onClick={() => decide(p, 'confirm')}
                    disabled={busyId === p._id}
                    className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-deep"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(p, 'reject')}
                    disabled={busyId === p._id}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-[#b4442a] hover:bg-[#b4442a]/10"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

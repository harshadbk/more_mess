import { useEffect, useState } from 'react'
import Field, { FormError } from '../../components/account/Field.jsx'
import { useNotice } from '../../components/Notice.jsx'
import { api } from '../../lib/api.js'
import { MEALS, mealLabel } from '../../data/accountOptions.js'

/** Price of one tiffin for each meal. Specials are priced per dish in the Menu tab. */
export default function PricesTab() {
  const notify = useNotice()
  const [prices, setPrices] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/admin/prices')
      .then(({ prices }) => setPrices(Object.fromEntries(MEALS.map((m) => [m, String(prices[m] ?? 0)]))))
      .catch((err) => setError(err.message))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/admin/prices', { method: 'PUT', body: prices })
      notify('Prices saved. They apply from today; past days keep their old price.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!prices) return error ? <FormError message={error} /> : <p className="text-muted">Loading prices…</p>

  return (
    <form onSubmit={save} className="card max-w-xl space-y-5 p-6" noValidate>
      <div>
        <h3 className="text-lg font-extrabold">Tiffin prices</h3>
        <p className="mt-1 text-sm text-muted">
          Price of one tiffin for each meal. Customers are charged for each tiffin they take. Specials have their own
          price in the Menu tab.
        </p>
      </div>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        {MEALS.map((m) => (
          <Field
            key={m}
            label={`${mealLabel(m)} (₹)`}
            name={`price-${m}`}
            type="number"
            min="0"
            inputMode="numeric"
            value={prices[m]}
            onChange={(e) => setPrices((p) => ({ ...p, [m]: e.target.value }))}
          />
        ))}
      </div>
      <p className="rounded-xl bg-saffron-soft/60 px-4 py-3 text-sm">
        Changing a price updates today and future days. Days already past keep the price they had, so old bills never
        change.
      </p>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : 'Save prices'}
      </button>
    </form>
  )
}

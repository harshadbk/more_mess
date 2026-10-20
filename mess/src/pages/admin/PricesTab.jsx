import { useEffect, useState } from 'react'
import Field, { FormError } from '../../components/account/Field.jsx'
import { useNotice } from '../../components/Notice.jsx'
import { api } from '../../lib/api.js'
import { MEALS, mealLabel } from '../../data/accountOptions.js'

/** Standard tiffin prices and the last time to change today's order for each meal. */
export default function PricesTab() {
  const notify = useNotice()
  const [values, setValues] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/admin/prices')
      .then(({ prices, cutoffs }) =>
        setValues({ prices: Object.fromEntries(MEALS.map((m) => [m, String(prices[m] ?? 0)])), cutoffs }),
      )
      .catch((err) => setError(err.message))
  }, [])

  const set = (group, meal) => (e) => setValues((v) => ({ ...v, [group]: { ...v[group], [meal]: e.target.value } }))

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/admin/prices', { method: 'PUT', body: values })
      notify('Saved. New prices apply from today; past days keep their old price.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!values) return error ? <FormError message={error} /> : <p className="text-muted">Loading…</p>

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-6 p-6" noValidate>
      <FormError message={error} />
      <div>
        <h3 className="text-lg font-extrabold">Standard tiffin prices</h3>
        <p className="mt-1 text-sm text-muted">
          Used for menu options without their own price. A dish with its own price (e.g. Paneer thali ₹80) uses that.
          Specials always have their own price.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {MEALS.map((m) => (
            <Field
              key={m}
              label={`${mealLabel(m)} (₹)`}
              name={`price-${m}`}
              type="number"
              min="0"
              inputMode="numeric"
              value={values.prices[m]}
              onChange={set('prices', m)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-extrabold">Order cut-off times</h3>
        <p className="mt-1 text-sm text-muted">
          After this time, nobody can change today's order for that meal, so the kitchen knows exactly what to cook.
          Specials close with dinner.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {MEALS.map((m) => (
            <Field
              key={m}
              label={`${mealLabel(m)} closes at`}
              name={`cutoff-${m}`}
              type="time"
              value={values.cutoffs[m]}
              onChange={set('cutoffs', m)}
            />
          ))}
        </div>
      </div>

      <p className="rounded-xl bg-saffron-soft/60 px-4 py-3 text-sm">
        Price changes update today and later days. Days already past keep the price they had, so old bills never change.
      </p>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

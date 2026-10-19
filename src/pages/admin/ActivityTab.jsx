import { useEffect, useState } from 'react'
import { FormError } from '../../components/account/Field.jsx'
import Heatmap from '../../components/account/Heatmap.jsx'
import { api } from '../../lib/api.js'

/** Heatmap of tiffins going out of the mess each day. Clicking a day opens its orders. */
export default function ActivityTab({ onOpenDay }) {
  const [days, setDays] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/history?days=364')
      .then(({ days }) => setDays(days))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="card p-6" aria-labelledby="activity-title">
      <h3 id="activity-title" className="text-lg font-extrabold">
        Tiffins from the mess, day by day
      </h3>
      <p className="mt-1 mb-5 text-sm text-muted">
        Last 12 months for all customers. Pick a meal to see just that meal. Darker = more tiffins. Click a day to see
        who ate what.
      </p>
      <FormError message={error} />
      {!days && !error && <p className="text-muted">Loading…</p>}
      {days && <Heatmap days={days} weeks={52} showAmount onSelect={onOpenDay} />}
    </section>
  )
}

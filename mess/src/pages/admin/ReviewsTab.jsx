import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { FormError } from '../../components/account/Field.jsx'
import { useNotice } from '../../components/Notice.jsx'
import { Stars } from '../../components/Testimonials.jsx'
import { api } from '../../lib/api.js'
import { formatDate } from '../../data/accountOptions.js'

const dayOf = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** Admin: every customer review, lowest ratings first if wanted, with a delete button. */
export default function ReviewsTab() {
  const notify = useNotice()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [lowFirst, setLowFirst] = useState(false)

  useEffect(() => {
    api('/reviews?limit=200')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  const remove = async (review) => {
    if (!window.confirm(`Delete ${review.name}'s ${review.rating}-star review? This cannot be undone.`)) return
    try {
      await api(`/reviews/${review._id}`, { method: 'DELETE' })
      setData((d) => ({ ...d, reviews: d.reviews.filter((r) => r._id !== review._id), count: d.count - 1 }))
      notify('Review deleted.')
    } catch (err) {
      notify(err.message)
    }
  }

  if (error) return <FormError message={error} />
  if (!data) return <p className="text-muted">Loading…</p>

  const list = lowFirst ? [...data.reviews].sort((a, b) => a.rating - b.rating) : data.reviews

  return (
    <section className="card p-6" aria-labelledby="reviews-admin-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="reviews-admin-title" className="text-lg font-extrabold">
          Customer reviews{' '}
          <span className="text-sm font-normal text-muted">
            {data.count ? `${data.average.toFixed(1)} ★ from ${data.count}` : 'none yet'}
          </span>
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowFirst} onChange={(e) => setLowFirst(e.target.checked)} />
          Lowest ratings first
        </label>
      </div>
      <p className="mt-1 text-sm text-muted">These show on the home page. Delete abusive or fake ones.</p>
      {list.length === 0 ? (
        <p className="mt-4 text-muted">No reviews yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {list.map((r) => (
            <li key={r._id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <Stars rating={r.rating} />
                  <strong>{r.name}</strong>
                  <span className="text-xs text-muted">{formatDate(dayOf(r.updatedAt))}</span>
                </p>
                {r.comment && <p className="mt-1 text-[15px] break-words">{r.comment}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(r)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#b4442a] hover:bg-[#b4442a]/10"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

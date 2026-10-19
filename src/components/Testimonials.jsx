import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Star, Trash2 } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import Field, { FormError } from './account/Field.jsx'
import { useNotice } from './Notice.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { formatDate } from '../data/accountOptions.js'

const LABELS = ['', 'Poor', 'Okay', 'Good', 'Very good', 'Excellent']
const SHOWN = 6 // reviews shown before "Show all"

/** Read-only stars, e.g. 4 of 5 filled. */
export function Stars({ rating, size = 'size-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(rating) ? 'fill-saffron text-saffron' : 'text-line'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/** 1-5 star picker. */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div>
      <div role="radiogroup" aria-label="Your rating" className="flex gap-1" onPointerLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}, ${LABELS[n]}`}
            onClick={() => onChange(n)}
            onPointerEnter={() => setHover(n)}
            className="rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-forest"
          >
            <Star
              className={`size-8 transition-colors ${n <= shown ? 'fill-saffron text-saffron' : 'text-line'}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm font-semibold text-forest">{LABELS[shown]}</p>
    </div>
  )
}

// A visitor's own review (no account): kept in this browser so they can change or delete it later.
const MINE_KEY = 'moremess.review'
const savedReview = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(MINE_KEY)) ?? null
    } catch {
      return null
    }
  },
  set: (value) => {
    try {
      if (value) localStorage.setItem(MINE_KEY, JSON.stringify(value))
      else localStorage.removeItem(MINE_KEY)
    } catch {
      /* storage unavailable: the review is still posted */
    }
  },
}

/** Visitor (not logged in): rate us with a name and mobile number. One review per number. */
function VisitorReviewForm({ onSaved }) {
  const notify = useNotice()
  const [mine, setMine] = useState(() => savedReview.get()) // { id, token, name, rating, comment }
  const [values, setValues] = useState(() => {
    const m = savedReview.get()
    return { name: m?.name ?? '', phone: '', rating: m?.rating ?? 0, comment: m?.comment ?? '' }
  })
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    if (!values.rating) return setError('Tap the stars to rate us.')
    if (values.name.trim().length < 2) return setError('Please enter your name.')
    if (!mine && values.phone.replace(/\D/g, '').length < 10) return setError('Enter your 10-digit mobile number.')
    setBusy(true)
    setError('')
    try {
      const { review, token } = mine
        ? await api(`/reviews/visitor/${mine.id}`, { method: 'PUT', body: { ...values, token: mine.token } })
        : await api('/reviews/visitor', { method: 'POST', body: values })
      const next = {
        id: review._id,
        token: token ?? mine.token,
        name: values.name.trim(),
        rating: review.rating,
        comment: review.comment,
      }
      savedReview.set(next)
      setMine(next)
      setEditing(false)
      notify(mine ? 'Your review was updated.' : 'Thank you for rating us!')
      onSaved()
    } catch (err) {
      if (mine && err.status === 404) {
        // Removed by the admin (or from another browser): start again.
        savedReview.set(null)
        setMine(null)
      }
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      await api(`/reviews/visitor/${mine.id}`, { method: 'DELETE', body: { token: mine.token } })
    } catch (err) {
      if (err.status !== 404) return notify(err.message)
    }
    savedReview.set(null)
    setMine(null)
    setValues({ name: '', phone: '', rating: 0, comment: '' })
    notify('Your review was deleted.')
    onSaved()
  }

  if (mine && !editing) {
    return (
      <div>
        <p className="text-sm font-semibold text-muted">Your review</p>
        <div className="mt-2">
          <Stars rating={mine.rating} size="size-5" />
        </div>
        {mine.comment && <p className="mt-2 leading-relaxed">{mine.comment}</p>}
        <div className="mt-4 flex gap-4 text-sm font-semibold">
          <button type="button" onClick={() => setEditing(true)} className="text-forest hover:underline">
            Change
          </button>
          <button type="button" onClick={remove} className="text-[#b4442a] hover:underline">
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="space-y-3" noValidate>
      <p className="font-bold">{mine ? 'Change your review' : 'Rate us, no login needed'}</p>
      <FormError message={error} />
      <StarPicker value={values.rating} onChange={(rating) => setValues((v) => ({ ...v, rating }))} />
      <Field
        label="Your name"
        name="reviewName"
        autoComplete="name"
        maxLength={60}
        value={values.name}
        onChange={set('name')}
      />
      {!mine && (
        <Field
          label="Mobile number"
          name="reviewPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={14}
          hint="Not shown publicly. One review per number."
          value={values.phone}
          onChange={set('phone')}
        />
      )}
      <label className="block">
        <span className="text-sm font-semibold">Tell others about it (optional)</span>
        <textarea
          rows={3}
          maxLength={500}
          value={values.comment}
          onChange={set('comment')}
          placeholder="Taste, quantity, timing, cleanliness…"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] focus:border-forest focus:ring-4 focus:ring-forest/15 focus:outline-none"
        />
        <span className="block text-right text-xs text-muted">{values.comment.length}/500</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={busy}>
          {busy ? 'Saving…' : mine ? 'Save review' : 'Post review'}
        </button>
        {mine && (
          <button type="button" onClick={() => setEditing(false)} className="btn-outline">
            Cancel
          </button>
        )}
      </div>
      {!mine && (
        <p className="text-center text-xs text-muted">
          A customer?{' '}
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Log in
          </Link>{' '}
          to rate as a verified customer.
        </p>
      )}
    </form>
  )
}

/** Customer: write, change or delete my review. */
function ReviewForm({ onSaved }) {
  const notify = useNotice()
  const [mine, setMine] = useState(undefined) // undefined = loading, null = none yet
  const [values, setValues] = useState({ rating: 0, comment: '' })
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/reviews/mine')
      .then(({ review }) => {
        setMine(review)
        if (review) setValues({ rating: review.rating, comment: review.comment })
      })
      .catch(() => setMine(null))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!values.rating) return setError('Tap the stars to rate us.')
    setBusy(true)
    setError('')
    try {
      const { review } = await api('/reviews/mine', { method: 'PUT', body: values })
      setMine(review)
      setEditing(false)
      notify(mine ? 'Your review was updated.' : 'Thank you for rating us!')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      await api('/reviews/mine', { method: 'DELETE' })
      setMine(null)
      setValues({ rating: 0, comment: '' })
      notify('Your review was deleted.')
      onSaved()
    } catch (err) {
      notify(err.message)
    }
  }

  if (mine === undefined) return <p className="text-sm text-muted">Loading…</p>

  if (mine && !editing) {
    return (
      <div>
        <p className="text-sm font-semibold text-muted">Your review</p>
        <div className="mt-2">
          <Stars rating={mine.rating} size="size-5" />
        </div>
        {mine.comment && <p className="mt-2 leading-relaxed">{mine.comment}</p>}
        <div className="mt-4 flex gap-4 text-sm font-semibold">
          <button type="button" onClick={() => setEditing(true)} className="text-forest hover:underline">
            Change
          </button>
          <button type="button" onClick={remove} className="text-[#b4442a] hover:underline">
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="space-y-3" noValidate>
      <p className="font-bold">{mine ? 'Change your review' : 'How was your food?'}</p>
      <FormError message={error} />
      <StarPicker value={values.rating} onChange={(rating) => setValues((v) => ({ ...v, rating }))} />
      <label className="block">
        <span className="text-sm font-semibold">Tell others about it (optional)</span>
        <textarea
          rows={3}
          maxLength={500}
          value={values.comment}
          onChange={(e) => setValues((v) => ({ ...v, comment: e.target.value }))}
          placeholder="Taste, quantity, timing, cleanliness…"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] focus:border-forest focus:ring-4 focus:ring-forest/15 focus:outline-none"
        />
        <span className="block text-right text-xs text-muted">{values.comment.length}/500</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={busy}>
          {busy ? 'Saving…' : mine ? 'Save review' : 'Post review'}
        </button>
        {mine && (
          <button type="button" onClick={() => setEditing(false)} className="btn-outline">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

/**
 * Reviews from real customers: the average rating, how many of each star, and the latest reviews.
 * Anyone can rate us: logged-in customers (shown as verified) and visitors with their mobile number (one review
 * per number). Both can change their review later. The admin can remove any review.
 */
export default function Testimonials() {
  const { user } = useAuth()
  const notify = useNotice()
  const [data, setData] = useState(null)
  const [all, setAll] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    api('/reviews?limit=200')
      .then(setData)
      .catch(() => setData(null)) // server unreachable: hide the section
  }, [reload])

  if (!data) return null

  const isAdmin = user?.role === 'admin'
  const remove = async (review) => {
    if (!window.confirm(`Remove ${review.name}'s review?`)) return
    try {
      await api(`/reviews/${review._id}`, { method: 'DELETE' })
      notify('Review removed.')
      setReload((k) => k + 1)
    } catch (err) {
      notify(err.message)
    }
  }

  const shown = all ? data.reviews : data.reviews.slice(0, SHOWN)

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="border-y border-line bg-white py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="reviews-title" eyebrow="Rate us" title="What customers say">
          Real ratings from people who eat with us.
        </SectionHeading>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="card p-6">
            {data.count ? (
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="font-display text-5xl font-extrabold text-forest">{data.average.toFixed(1)}</p>
                  <Stars rating={data.average} size="size-5" />
                  <p className="mt-1 text-sm text-muted">
                    {data.count} {data.count === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>
                <ul className="min-w-48 flex-1 space-y-1.5 text-sm" aria-label="Ratings by stars">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <li key={n} className="flex items-center gap-2">
                      <span className="w-8 tabular-nums text-muted">{n} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
                        <span
                          className="block h-full rounded-full bg-saffron"
                          style={{ width: `${(data.stars[n] / data.count) * 100}%` }}
                        />
                      </span>
                      <span className="w-8 text-right tabular-nums text-muted">{data.stars[n]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted">No ratings yet. Be the first to rate us!</p>
            )}
          </div>

          <div className="card p-6">
            {!user ? (
              <VisitorReviewForm onSaved={() => setReload((k) => k + 1)} />
            ) : isAdmin ? (
              <p className="text-sm text-muted">
                You are the admin: customers rate the mess here. Remove a review with its delete button.
              </p>
            ) : (
              <ReviewForm onSaved={() => setReload((k) => k + 1)} />
            )}
          </div>
        </div>

        {shown.length > 0 && (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((r, i) => (
              <Reveal as="li" key={r._id} delay={Math.min(i, 5) * 60}>
                <figure className="card flex h-full flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={r.rating} />
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        className="rounded-full p-1.5 text-[#b4442a] hover:bg-[#b4442a]/10"
                        aria-label={`Remove ${r.name}'s review`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <blockquote className="mt-3 flex-1 leading-relaxed break-words text-charcoal">
                    {r.comment || <span className="text-muted">Rated {LABELS[r.rating].toLowerCase()}.</span>}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-line pt-3">
                    <p className="flex flex-wrap items-center gap-1.5 font-display font-bold">
                      {r.name}
                      {r.verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-fresh/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-forest">
                          <BadgeCheck className="size-3.5" aria-hidden="true" />
                          Verified customer
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(new Date(r.updatedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        )}
        {data.reviews.length > SHOWN && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setAll((v) => !v)} className="btn-outline">
              {all ? 'Show fewer' : `Show all ${data.reviews.length} reviews`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

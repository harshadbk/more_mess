import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Send, Star } from 'lucide-react'
import { useState } from 'react'
import { reviewApi } from '../../services/api'
import { cn } from '../../utils/cn'
import Button from '../ui/Button'

const input = 'h-12 w-full rounded-2xl border-2 border-transparent bg-mist px-4 outline-none transition focus:border-brand/40 focus:bg-white'

export default function ReviewForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', role: '', rating: 5, text: '' })
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'loading', message: '' })
    try {
      const { review } = await reviewApi.create(form)
      onCreated?.(review)
      setForm({ name: '', role: '', rating: 5, text: '' })
      setStatus({ state: 'success', message: 'Thank you! Your review is live 🎉' })
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 }, colors: ['#FF6B00', '#FFC93C', '#2ECC71'], disableForReducedMotion: true })
    } catch (err) {
      setStatus({ state: 'error', message: err.status ? err.message : 'Could not reach the server. Please try again later.' })
    }
  }

  return (
    <motion.form initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onSubmit={submit} className="mx-auto mt-16 max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft sm:p-9">
      <h3 className="text-2xl font-bold">Loved your food? Leave a review ✍️</h3>
      <p className="mt-1 text-sm text-ink/55">Your feedback helps us serve you better.</p>

      <div className="mt-6 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={form.rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setForm((f) => ({ ...f, rating: n }))}
            className="p-1 transition-transform hover:scale-125"
          >
            <Star size={30} className={cn('transition-colors', n <= (hover || form.rating) ? 'fill-cheese text-cheese' : 'text-ink/20')} />
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Your name</span>
          <input required maxLength={60} value={form.name} onChange={set('name')} className={input} placeholder="Aditya" />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">You are a… (optional)</span>
          <input maxLength={40} value={form.role} onChange={set('role')} className={input} placeholder="Student, Parent, Office worker" />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Your review</span>
        <textarea required minLength={5} maxLength={500} rows={4} value={form.text} onChange={set('text')} className={cn(input, 'h-auto resize-none py-3')} placeholder="What did you order? How was it?" />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status.state === 'loading'}>
          <Send size={17} /> {status.state === 'loading' ? 'Posting…' : 'Post review'}
        </Button>
        {status.message && (
          <p role="status" className={cn('text-sm font-semibold', status.state === 'error' ? 'text-tomato' : 'text-emerald-600')}>
            {status.message}
          </p>
        )}
      </div>
    </motion.form>
  )
}

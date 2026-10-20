import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Lock, LogOut, RefreshCw, Search, Trash2, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/common/Logo'
import Seo from '../components/common/Seo'
import Button from '../components/ui/Button'
import Stars from '../components/ui/Stars'
import { adminApi, adminToken } from '../services/api'
import { cn } from '../utils/cn'

const input = 'h-12 w-full rounded-2xl border-2 border-transparent bg-mist pl-11 pr-4 outline-none transition focus:border-brand/40 focus:bg-white'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await adminApi.login(username, password)
      adminToken.set(token)
      onLogin(token)
    } catch (err) {
      setError(err.status ? err.message : 'Server is not reachable. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-lift sm:p-10">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white">
        <Lock size={24} />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold">Admin login</h1>
      <p className="mt-1 text-sm text-ink/55">Manage customer reviews.</p>
      <label className="relative mt-8 block">
        <span className="sr-only">Username</span>
        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className={input} />
      </label>
      <label className="relative mt-4 block">
        <span className="sr-only">Password</span>
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={input} />
      </label>
      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-tomato">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </motion.form>
  )
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'bad', label: 'Bad (1–2★)' },
  { id: 'mid', label: 'Okay (3★)' },
  { id: 'good', label: 'Good (4–5★)' },
]

function Dashboard({ token, onLogout }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { reviews } = await adminApi.reviews(token)
      setReviews(reviews)
    } catch (err) {
      if (err.status === 401) onLogout()
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id) => {
    try {
      await adminApi.remove(token, id)
      setReviews((r) => r.filter((x) => x._id !== id))
    } catch (err) {
      if (err.status === 401) onLogout()
      else setError(err.message)
    } finally {
      setConfirmId(null)
    }
  }

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return reviews.filter((r) => {
      if (filter === 'bad' && r.rating > 2) return false
      if (filter === 'mid' && r.rating !== 3) return false
      if (filter === 'good' && r.rating < 4) return false
      return !term || `${r.name} ${r.role} ${r.text}`.toLowerCase().includes(term)
    })
  }, [reviews, filter, q])

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '–'
  const bad = reviews.filter((r) => r.rating <= 2).length

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Reviews</h1>
          <p className="text-ink/55">Delete anything abusive, spam or unfair.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button variant="dark" size="sm" onClick={onLogout}>
            <LogOut size={15} /> Logout
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
        {[
          ['Total', reviews.length],
          ['Avg rating', avg],
          ['Bad reviews', bad],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 sm:text-sm">{label}</p>
            <p className={cn('mt-1 font-display text-3xl font-extrabold', label === 'Bad reviews' && value > 0 && 'text-tomato')}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-bold transition', filter === f.id ? 'bg-brand text-white' : 'bg-white text-ink/60 shadow-sm hover:text-brand')}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative md:ml-auto md:w-72">
          <span className="sr-only">Search reviews</span>
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews…" className="h-11 w-full rounded-full bg-white pl-11 pr-4 shadow-sm outline-none ring-brand/30 focus:ring-4" />
        </label>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-tomato/10 p-4 text-sm font-semibold text-tomato">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading && !reviews.length && Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-28 rounded-3xl" />)}
        {!loading && !shown.length && <p className="rounded-3xl bg-white p-10 text-center text-ink/50 shadow-soft">No reviews here.</p>}
        <AnimatePresence initial={false}>
          {shown.map((r) => (
            <motion.article
              key={r._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -60, transition: { duration: 0.25 } }}
              className={cn('rounded-3xl bg-white p-5 shadow-soft sm:p-6', r.rating <= 2 && 'ring-2 ring-tomato/30')}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-bold">{r.name}</p>
                    {r.role && <span className="text-sm text-ink/50">{r.role}</span>}
                    <Stars value={r.rating} size={14} />
                    <span className="text-xs text-ink/40">{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line break-words text-ink/70">{r.text}</p>
                </div>
                {confirmId === r._id ? (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button onClick={() => remove(r._id)} className="rounded-full bg-tomato px-4 py-2 text-sm font-bold text-white">
                      Delete
                    </button>
                    <button onClick={() => setConfirmId(null)} className="rounded-full bg-mist px-4 py-2 text-sm font-bold">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(r._id)} aria-label={`Delete review by ${r.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tomato/10 text-tomato transition hover:bg-tomato hover:text-white">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function Admin() {
  const [token, setToken] = useState(adminToken.get)
  const logout = useCallback(() => {
    adminToken.clear()
    setToken(null)
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <Seo title="Admin" path="/admin" />
      <meta name="robots" content="noindex" />
      <header className="container-x flex h-20 items-center justify-between">
        <Logo />
        <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-brand">
          <ArrowLeft size={16} /> Back to site
        </Link>
      </header>
      <main className={cn('container-x flex max-w-4xl pb-20', token ? 'pt-6' : 'min-h-[calc(100vh-5rem)] items-center')}>
        {token ? <Dashboard token={token} onLogout={logout} /> : <Login onLogin={setToken} />}
      </main>
    </div>
  )
}

import 'dotenv/config'
import crypto from 'node:crypto'
import dns from 'node:dns'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb'

const { MONGODB_URI, DB_NAME = 'moremess', COLLECTION = 'stall_review', ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, PORT = 5000, CLIENT_ORIGIN = '' } = process.env

for (const [k, v] of Object.entries({ MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET })) {
  if (!v) {
    console.error(`Missing ${k} in server/.env`)
    process.exit(1)
  }
}

// Some Windows/router DNS setups refuse SRV lookups needed by mongodb+srv:// URIs.
// If the system resolver can't answer, fall back to public DNS.
if (MONGODB_URI.startsWith('mongodb+srv://')) {
  const host = new URL(MONGODB_URI).hostname
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`)
  } catch {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
    console.log('System DNS could not resolve MongoDB SRV record, using public DNS')
  }
}

const client = new MongoClient(MONGODB_URI)
await client.connect()
const reviews = client.db(DB_NAME).collection(COLLECTION)
await reviews.createIndex({ createdAt: -1 })
console.log(`Connected to MongoDB → ${DB_NAME}.${COLLECTION}`)

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '10kb' }))
app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean) }))

const clean = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')
const toPublic = ({ _id, name, role, rating, text, createdAt }) => ({ _id, name, role, rating, text, createdAt })

// ---------- Public ----------

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/reviews', async (_req, res) => {
  const list = await reviews.find().sort({ createdAt: -1 }).limit(30).toArray()
  res.json({ reviews: list.map(toPublic) })
})

app.post('/api/reviews', rateLimit({ windowMs: 15 * 60_000, limit: 5, message: { error: 'Too many reviews. Please try again later.' } }), async (req, res) => {
  const name = clean(req.body?.name, 60)
  const role = clean(req.body?.role, 40)
  const text = String(req.body?.text ?? '').trim().slice(0, 500)
  const rating = Number(req.body?.rating)

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' })
  if (text.length < 5) return res.status(400).json({ error: 'Review is too short.' })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5 stars.' })

  const doc = { name, role, rating, text, createdAt: new Date() }
  const { insertedId } = await reviews.insertOne(doc)
  res.status(201).json({ review: toPublic({ ...doc, _id: insertedId }) })
})

// ---------- Admin ----------

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

app.post('/api/admin/login', rateLimit({ windowMs: 15 * 60_000, limit: 10, message: { error: 'Too many attempts. Try again in 15 minutes.' } }), (req, res) => {
  const { username, password } = req.body ?? {}
  if (!(safeEqual(username, ADMIN_USERNAME) & safeEqual(password, ADMIN_PASSWORD))) {
    return res.status(401).json({ error: 'Wrong username or password.' })
  }
  res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' }) })
})

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  try {
    if (jwt.verify(token, JWT_SECRET).role === 'admin') return next()
  } catch {
    /* fall through */
  }
  res.status(401).json({ error: 'Session expired. Please log in again.' })
}

app.get('/api/admin/reviews', requireAdmin, async (_req, res) => {
  const list = await reviews.find().sort({ createdAt: -1 }).toArray()
  res.json({ reviews: list.map(toPublic) })
})

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id.' })
  const { deletedCount } = await reviews.deleteOne({ _id: new ObjectId(req.params.id) })
  if (!deletedCount) return res.status(404).json({ error: 'Review not found.' })
  res.json({ ok: true })
})

// Express 5 forwards async errors here.
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))

import crypto from 'node:crypto'
import { Router } from 'express'
import Review from '../models/Review.js'
import { adminOnly, loggedIn } from '../auth.js'
import { phoneOf, rateLimit } from '../rateLimit.js'

const router = Router()

// "Rohan Kumar Patil" -> "Rohan P." (customers' full names are not shown publicly)
const shortName = (name = '') => {
  const [first, ...rest] = name.trim().split(/\s+/)
  return rest.length ? `${first} ${rest.at(-1)[0].toUpperCase()}.` : first || 'Customer'
}

// Anyone can read the reviews: average, how many of each star, and the newest ones.
router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 200)
  const [reviews, stats] = await Promise.all([
    Review.find().sort({ updatedAt: -1 }).limit(limit),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ])
  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const s of stats) stars[s._id] = s.count
  const count = Object.values(stars).reduce((a, b) => a + b, 0)
  const average = count ? Object.entries(stars).reduce((sum, [star, n]) => sum + star * n, 0) / count : 0
  // `verified` = written by a logged-in customer; who wrote it (and visitors' numbers) stays private.
  const shown = reviews.map(({ _id, name, rating, comment, createdAt, updatedAt, user }) => ({
    _id,
    name,
    rating,
    comment,
    createdAt,
    updatedAt,
    verified: Boolean(user),
  }))
  res.json({ reviews: shown, count, average: Math.round(average * 10) / 10, stars })
})

/* ------------------------------------------- Visitors (no account needed) */

const limit = rateLimit(10, 10, 'Too many reviews from here. Please try again later.')
const fail = (status, message) => Object.assign(new Error(message), { status })

function reviewFields(body) {
  const name = String(body.name ?? '').trim()
  const rating = Math.round(Number(body.rating))
  const comment = String(body.comment ?? '').trim()
  if (name.length < 2 || name.length > 60) throw fail(400, 'Please enter your name.')
  if (!(rating >= 1 && rating <= 5)) throw fail(400, 'Pick 1 to 5 stars.')
  if (comment.length > 500) throw fail(400, 'Keep the review under 500 characters.')
  return { name: shortName(name), rating, comment }
}

// The visitor's own review, found with the id and token their browser kept.
async function visitorReview(id, token) {
  const review = await Review.findById(id).select('+token')
  const given = String(token ?? '')
  const ok =
    review?.token && given.length === review.token.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(review.token))
  if (!ok) throw fail(404, 'Review not found.')
  return review
}

// Rate us without an account: { name, phone, rating, comment }. One review per mobile number.
router.post('/visitor', limit, async (req, res) => {
  const fields = reviewFields(req.body)
  const phone = phoneOf(req.body.phone)
  if (!phone) throw fail(400, 'Enter a valid 10-digit mobile number.')
  if (await Review.exists({ phone })) throw fail(400, 'This number has already rated us. Thank you!')
  const token = crypto.randomBytes(16).toString('hex')
  try {
    const review = await Review.create({ ...fields, phone, token })
    res.status(201).json({ review: { _id: review._id, name: review.name, rating: review.rating, comment: review.comment }, token })
  } catch (err) {
    if (err.code === 11000) throw fail(400, 'This number has already rated us. Thank you!')
    throw err
  }
})

// Change or delete it later from the same browser: { token, name, rating, comment }
router.put('/visitor/:id', limit, async (req, res) => {
  const review = await visitorReview(req.params.id, req.body.token)
  Object.assign(review, reviewFields(req.body))
  await review.save()
  res.json({ review: { _id: review._id, name: review.name, rating: review.rating, comment: review.comment } })
})

router.delete('/visitor/:id', async (req, res) => {
  const review = await visitorReview(req.params.id, req.body.token)
  await review.deleteOne()
  res.json({ deleted: true })
})

/* ---------------------------------------------------- Logged-in customers */

router.use(loggedIn)

// My own review (null if I haven't written one).
router.get('/mine', async (req, res) => {
  res.json({ review: await Review.findOne({ user: req.user._id }) })
})

// Write or change my review: { rating: 1-5, comment? }. Only customers can review.
router.put('/mine', async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Only customers can write a review.' })
  const rating = Math.round(Number(req.body.rating))
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Pick 1 to 5 stars.' })
  const comment = String(req.body.comment ?? '').trim()
  if (comment.length > 500) return res.status(400).json({ error: 'Keep the review under 500 characters.' })
  const review = await Review.findOneAndUpdate(
    { user: req.user._id },
    { name: shortName(req.user.name), rating, comment },
    { upsert: true, new: true, runValidators: true },
  )
  res.json({ review })
})

router.delete('/mine', async (req, res) => {
  await Review.deleteOne({ user: req.user._id })
  res.json({ deleted: true })
})

// Admin removes a review (e.g. abusive or fake).
router.delete('/:id', adminOnly, async (req, res) => {
  await Review.findByIdAndDelete(req.params.id)
  res.json({ deleted: true })
})

export default router

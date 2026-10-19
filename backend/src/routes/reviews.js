import { Router } from 'express'
import Review from '../models/Review.js'
import { adminOnly, loggedIn } from '../auth.js'

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
    Review.find({}, '-user').sort({ updatedAt: -1 }).limit(limit),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ])
  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const s of stats) stars[s._id] = s.count
  const count = Object.values(stars).reduce((a, b) => a + b, 0)
  const average = count ? Object.entries(stars).reduce((sum, [star, n]) => sum + star * n, 0) / count : 0
  res.json({ reviews, count, average: Math.round(average * 10) / 10, stars })
})

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

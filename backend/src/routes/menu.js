import { Router } from 'express'
import Dish from '../models/Dish.js'
import { adminOnly, loggedIn } from '../auth.js'
import { getSettings, isDate, today } from '../tiffins.js'

const router = Router()

// Photos are resized in the browser before upload; this stops anything huge.
const MAX_IMAGE = 400_000 // characters (about 300 KB)

function dishFields(body) {
  const { meal, name, food, price, description, image } = body
  if (image && (!image.startsWith('data:image/') || image.length > MAX_IMAGE)) {
    throw Object.assign(new Error('Photo must be an image under 300 KB.'), { status: 400 })
  }
  return { meal, name, food, price: Number(price) || 0, description, image }
}

// Anyone (even without logging in) can see the menu for a day. Default: today.
router.get('/', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  const [dishes, settings] = await Promise.all([Dish.find({ date }).sort({ createdAt: 1 }), getSettings()])
  res.json({ date, dishes, prices: settings.prices }) // meal prices are public too
})

// Everything below is for the admin only.
router.use(loggedIn, adminOnly)

// Add a dish: { date, meal, name, food, price, description, image }
router.post('/', async (req, res) => {
  if (!isDate(req.body.date)) return res.status(400).json({ error: 'Pick a date.' })
  if (!req.body.name?.trim()) return res.status(400).json({ error: 'Dish name is required.' })
  if (req.body.meal === 'special' && !(Number(req.body.price) > 0)) {
    return res.status(400).json({ error: 'Specials need a price.' })
  }
  const dish = await Dish.create({ date: req.body.date, ...dishFields(req.body) })
  res.status(201).json({ dish })
})

// Edit a dish
router.put('/:id', async (req, res) => {
  const dish = await Dish.findByIdAndUpdate(req.params.id, dishFields(req.body), { new: true, runValidators: true })
  if (!dish) return res.status(404).json({ error: 'Dish not found.' })
  res.json({ dish })
})

router.delete('/:id', async (req, res) => {
  await Dish.findByIdAndDelete(req.params.id)
  res.json({ deleted: true })
})

// Copy every dish from one day to another: { from, to }
router.post('/copy', async (req, res) => {
  const { from, to } = req.body
  if (!isDate(from) || !isDate(to) || from === to) return res.status(400).json({ error: 'Pick two different days.' })
  const dishes = await Dish.find({ date: from })
  if (!dishes.length) return res.status(404).json({ error: 'That day has no dishes to copy.' })
  await Dish.insertMany(
    dishes.map(({ meal, name, food, price, description, image }) => ({
      date: to,
      meal,
      name,
      food,
      price,
      description,
      image,
    })),
  )
  res.json({ dishes: await Dish.find({ date: to }).sort({ createdAt: 1 }) })
})

export default router

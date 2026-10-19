import { Router } from 'express'
import Dish from '../models/Dish.js'
import { adminOnly, loggedIn } from '../auth.js'
import { dropExpiredDishes, getSettings, isDate, lockedMeals, syncMenuDay, today } from '../tiffins.js'

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

// Dishes can't be added to a meal whose cut-off has passed (they would be deleted right away).
async function checkOpen(date, meal) {
  if (lockedMeals(date, (await getSettings()).cutoffs).includes(meal)) {
    const when = date === today() ? 'today' : 'that day'
    throw Object.assign(new Error(`${meal[0].toUpperCase() + meal.slice(1)} time is over for ${when}. Add it for tomorrow instead.`), { status: 400 })
  }
}

// Anyone (even without logging in) can see the menu for a day. Default: today.
router.get('/', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  await dropExpiredDishes()
  const [dishes, settings] = await Promise.all([Dish.find({ date }).sort({ createdAt: 1 }), getSettings()])
  // meal prices are public too; `locked` = meals whose time is over on that day
  res.json({ date, dishes, prices: settings.prices, locked: lockedMeals(date, settings.cutoffs) })
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
  await checkOpen(req.body.date, req.body.meal)
  const dish = await Dish.create({ date: req.body.date, ...dishFields(req.body) })
  await syncMenuDay(dish.date) // orders for that day pick up the new option
  res.status(201).json({ dish })
})

// Edit a dish
router.put('/:id', async (req, res) => {
  const old = await Dish.findById(req.params.id)
  if (!old) return res.status(404).json({ error: 'Dish not found.' })
  await checkOpen(old.date, req.body.meal ?? old.meal)
  const dish = await Dish.findByIdAndUpdate(req.params.id, dishFields(req.body), { new: true, runValidators: true })
  if (!dish) return res.status(404).json({ error: 'Dish not found.' })
  await syncMenuDay(dish.date)
  res.json({ dish })
})

router.delete('/:id', async (req, res) => {
  const dish = await Dish.findByIdAndDelete(req.params.id)
  if (dish) await syncMenuDay(dish.date) // its orders move to another option
  res.json({ deleted: true })
})

// Copy every dish from one day to another: { from, to }
router.post('/copy', async (req, res) => {
  const { from, to } = req.body
  if (!isDate(from) || !isDate(to) || from === to) return res.status(400).json({ error: 'Pick two different days.' })
  const closed = lockedMeals(to, (await getSettings()).cutoffs)
  const dishes = (await Dish.find({ date: from })).filter((d) => !closed.includes(d.meal))
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
  await syncMenuDay(to)
  res.json({ dishes: await Dish.find({ date: to }).sort({ createdAt: 1 }) })
})

export default router

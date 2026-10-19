import { Router } from 'express'
import Dish from '../models/Dish.js'
import Order from '../models/Order.js'
import { loggedIn } from '../auth.js'
import {
  accountOf,
  addDays,
  catchUp,
  dayFor,
  getSettings,
  isDate,
  MEALS,
  orderAmount,
  perDay,
  today,
} from '../tiffins.js'

const router = Router()
router.use(loggedIn)

// My tiffins for one day (default today).
router.get('/', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  res.json({ order: await dayFor(req.user, date) })
})

// Choose my tiffins for today or a later day:
// { date, breakfast, lunch, dinner, specials: [{ dish: <dish id>, qty }] }
router.put('/', async (req, res) => {
  const { date, specials = [] } = req.body
  if (!isDate(date)) return res.status(400).json({ error: 'Pick a date.' })
  if (date < today()) return res.status(400).json({ error: 'You cannot change a past day.' })

  // Specials must be on that day's menu. Copy their name and price into the order.
  const wanted = specials.filter((s) => s.qty > 0)
  const dishes = await Dish.find({ _id: { $in: wanted.map((s) => s.dish) }, date, meal: 'special' })
  const chosen = wanted
    .map((s) => {
      const dish = dishes.find((d) => d._id.equals(s.dish))
      return dish && { dish: dish._id, name: dish.name, price: dish.price, qty: Math.min(20, Math.floor(s.qty)) }
    })
    .filter(Boolean)

  const meals = Object.fromEntries(MEALS.map((meal) => [meal, Boolean(req.body[meal])]))
  const { prices } = await getSettings()
  const order = await Order.findOneAndUpdate(
    { user: req.user._id, date },
    { ...meals, specials: chosen, custom: true, amount: orderAmount({ ...meals, specials: chosen }, prices) },
    { upsert: true, new: true },
  )
  res.json({ order })
})

// My days taken, tiffins, charges, paid and pending (and my group's).
router.get('/account', async (req, res) => {
  res.json(await accountOf(req.user))
})

// My tiffins per day for the heatmap (default last 26 weeks).
router.get('/history', async (req, res) => {
  await catchUp()
  const days = Math.min(Number(req.query.days) || 182, 400)
  const orders = await Order.find({ user: req.user._id, date: { $gte: addDays(today(), 1 - days), $lte: today() } })
  res.json({ days: perDay(orders) })
})

export default router

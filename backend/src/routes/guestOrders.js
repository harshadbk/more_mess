import crypto from 'node:crypto'
import { Router } from 'express'
import Dish from '../models/Dish.js'
import GuestOrder from '../models/GuestOrder.js'
import { getSettings, itemFor, itemsAmount, lockedMeals, MEALS, nonVegDay, servedDishes, today } from '../tiffins.js'

// "Order for today only" from the home page: no login. Saved when the WhatsApp message is prepared,
// so the kitchen list and the admin panel count it straight away.
const router = Router()

const fail = (status, message) => Object.assign(new Error(message), { status })

// Same rule as the website: a 10-digit Indian mobile, stored as '91XXXXXXXXXX'.
function phoneOf(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  return /^[1-9]\d{9}$/.test(digits) ? `91${digits}` : ''
}

// Nobody needs more than a few orders a minute: stops a script from filling the kitchen list.
const recent = new Map() // ip -> [timestamps]
function rateLimit(req, _res, next) {
  const now = Date.now()
  const hits = (recent.get(req.ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  if (hits.length >= 10) return next(fail(429, 'Too many orders from here. Please message us on WhatsApp.'))
  hits.push(now)
  recent.set(req.ip, hits)
  if (recent.size > 5000) recent.clear()
  next()
}

const MAX_PER_PHONE = 5 // open orders per number per day

// Checks the form and turns it into order lines from today's menu.
async function orderFields(body) {
  const date = today()
  const name = String(body.name ?? '').trim()
  const phone = phoneOf(body.phone)
  const count = Number(body.count)
  const delivery = body.delivery === 'delivery' ? 'delivery' : 'pickup'
  const address = delivery === 'delivery' ? String(body.address ?? '').trim() : ''
  const meals = MEALS.filter((m) => Array.isArray(body.meals) && body.meals.includes(m))

  if (name.length < 2 || name.length > 60) throw fail(400, 'Please enter your name.')
  if (!phone) throw fail(400, 'Enter a valid 10-digit mobile number.')
  if (!meals.length) throw fail(400, 'Pick at least one meal.')
  if (!Number.isInteger(count) || count < 1 || count > 50) throw fail(400, 'Enter 1 to 50 tiffins.')
  if (delivery === 'delivery' && address.length < 5) throw fail(400, 'Enter the delivery address.')

  const [settings, allDishes] = await Promise.all([getSettings(), Dish.find({ date }).sort({ createdAt: 1 })])
  const closed = meals.filter((m) => lockedMeals(date, settings.cutoffs).includes(m))
  if (closed.length) throw fail(400, `Orders for ${closed.join(', ')} are closed for today.`)

  const dishes = servedDishes(allDishes, date)
  const food = body.food === 'non-veg' && nonVegDay(date) ? 'non-veg' : 'veg'
  const items = meals.map((meal) => {
    const options = dishes.filter((d) => d.meal === meal)
    const picked = options.find((d) => String(d._id) === String(body.choice?.[meal]))
    const ofKind = options.filter((d) => (d.food === 'non-veg') === (food === 'non-veg'))
    return itemFor(meal, picked ?? ofKind[0] ?? options[0], count, settings.prices, food)
  })

  return {
    date,
    name,
    phone,
    items,
    amount: itemsAmount(items),
    delivery,
    address,
    note: String(body.note ?? '').trim().slice(0, 300),
  }
}

const shown = (o) => ({ _id: o._id, code: o.code, amount: o.amount, items: o.items, status: o.status })

// Place an order: { name, phone, meals, choice: { meal: dishId }, count, food, delivery, address, note }
router.post('/', rateLimit, async (req, res) => {
  const fields = await orderFields(req.body)
  const open = await GuestOrder.countDocuments({ phone: fields.phone, date: fields.date, status: { $ne: 'cancelled' } })
  if (open >= MAX_PER_PHONE) throw fail(400, 'This number already has several orders today. Please message us on WhatsApp.')

  const token = crypto.randomBytes(16).toString('hex')
  for (let tries = 0; ; tries++) {
    try {
      const code = `G${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      const order = await GuestOrder.create({ ...fields, code, token })
      return res.status(201).json({ order: shown(order), token })
    } catch (err) {
      if (err.code !== 11000 || tries >= 3) throw err // code already taken: try another
    }
  }
})

// Fix the order before sending it (after "Edit order"): same body, plus the token from placing it.
router.put('/:id', rateLimit, async (req, res) => {
  const order = await GuestOrder.findById(req.params.id).select('+token')
  const token = String(req.body.token ?? '')
  const same =
    order && token.length === order.token.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(order.token))
  if (!same) throw fail(404, 'Order not found.')
  if (order.status !== 'new' || order.date !== today()) throw fail(400, 'This order can no longer be changed here.')
  Object.assign(order, await orderFields(req.body))
  await order.save()
  res.json({ order: shown(order) })
})

export default router

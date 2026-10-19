import { Router } from 'express'
import Group from '../models/Group.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { adminOnly, loggedIn } from '../auth.js'
import {
  addDays,
  allDues,
  catchUp,
  getSettings,
  isDate,
  MEALS,
  orderAmount,
  perDay,
  planMeals,
  startOf,
  today,
} from '../tiffins.js'

const router = Router()
router.use(loggedIn, adminOnly) // every admin route needs an admin

/* ----------------------------------------------------------------- Users */

router.get('/users', async (_req, res) => {
  res.json({ users: await User.find().sort({ createdAt: -1 }) })
})

// Mark a customer active or "left the mess" ({ active: true/false })
router.patch('/users/:id', async (req, res) => {
  const active = Boolean(req.body.active)
  const update = active ? { active, startDate: addDays(today(), 1) } : { active }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  // Someone who left gets no more tiffins after today.
  if (!active) await Order.deleteMany({ user: user._id, date: { $gt: today() } })
  res.json({ user })
})

// Delete a user: remove them from every group and delete the groups they own
router.delete('/users/:id', async (req, res) => {
  if (req.user._id.equals(req.params.id)) return res.status(400).json({ error: 'You cannot delete yourself.' })

  await Group.deleteMany({ owner: req.params.id })
  await Group.updateMany({}, { $pull: { members: req.params.id } })
  await Order.deleteMany({ user: req.params.id })
  await User.findByIdAndDelete(req.params.id)
  res.json({ deleted: true })
})

// All groups with their members
router.get('/groups', async (_req, res) => {
  const groups = await Group.find().sort({ createdAt: -1 }).populate('owner members', 'name email phone')
  res.json({ groups })
})

/* ---------------------------------------------------------------- Orders */

// How many tiffins to make on a day (default today), per group and per individual.
router.get('/orders', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  if (date <= today()) await catchUp()

  const [users, orders, groups] = await Promise.all([
    User.find({ role: 'user' }).sort({ name: 1 }),
    Order.find({ date }),
    Group.find().sort({ name: 1 }),
  ])

  // Each person's tiffins: their saved record, or for a future day their plan.
  const people = users
    .map((user) => {
      let order = orders.find((o) => o.user.equals(user._id))
      if (!order && date > today() && user.active && startOf(user) <= date) order = { ...planMeals(user), specials: [] }
      if (!order) return null
      return {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        ...Object.fromEntries(MEALS.map((meal) => [meal, order[meal]])),
        specials: order.specials.map((s) => ({ name: s.name, qty: s.qty })),
        changed: Boolean(order.custom),
      }
    })
    .filter(Boolean)

  const count = (list) => ({
    ...Object.fromEntries(MEALS.map((meal) => [meal, list.filter((p) => p[meal]).length])),
    specials: list.reduce((sum, p) => sum + p.specials.reduce((s, x) => s + x.qty, 0), 0),
  })

  // Specials to cook, added up by dish name.
  const specials = {}
  for (const p of people) for (const s of p.specials) specials[s.name] = (specials[s.name] || 0) + s.qty

  const isMember = (g, p) => g.members.some((m) => m.equals(p._id))
  res.json({
    date,
    total: count(people),
    specials: Object.entries(specials).map(([name, qty]) => ({ name, qty })),
    groups: groups
      .map((g) => {
        const members = people.filter((p) => isMember(g, p))
        return { _id: g._id, name: g.name, members, ...count(members) }
      })
      .filter((g) => g.members.length),
    individuals: people.filter((p) => !groups.some((g) => isMember(g, p))),
  })
})

// Tiffins per day for the whole mess, for the heatmap (default last 26 weeks).
router.get('/history', async (req, res) => {
  await catchUp()
  const days = Math.min(Number(req.query.days) || 182, 400)
  const orders = await Order.find({ date: { $gte: addDays(today(), 1 - days), $lte: today() } })
  res.json({ days: perDay(orders) })
})

/* ----------------------------------------------------------------- Money */

// What every group and individual owes.
router.get('/dues', async (_req, res) => {
  res.json({ dues: await allDues() })
})

router.get('/prices', async (_req, res) => {
  res.json({ prices: (await getSettings()).prices })
})

// Set meal prices: { breakfast, lunch, dinner }. Applies from today; past days keep their old price.
router.put('/prices', async (req, res) => {
  const settings = await getSettings()
  for (const meal of MEALS) {
    const price = Number(req.body[meal])
    if (!(price >= 0)) return res.status(400).json({ error: `Enter a price for ${meal}.` })
    settings.prices[meal] = price
  }
  await settings.save()

  const upcoming = await Order.find({ date: { $gte: today() } })
  for (const order of upcoming) {
    order.amount = orderAmount(order, settings.prices)
    await order.save()
  }
  res.json({ prices: settings.prices })
})

export default router

import { Router } from 'express'
import Dish from '../models/Dish.js'
import Group from '../models/Group.js'
import GuestOrder from '../models/GuestOrder.js'
import Order from '../models/Order.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import { adminOnly, loggedIn } from '../auth.js'
import {
  addDays,
  allDues,
  applyPrices,
  catchUp,
  getSettings,
  isDate,
  MEALS,
  monthSheet,
  perDay,
  removeGroup,
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
  // Someone who left gets no more tiffins of their own after today.
  if (!active) await Order.deleteMany({ account: user._id, date: { $gt: today() } })
  res.json({ user })
})

// Delete a user. Groups they own are removed (their bill and payments move to another member).
router.delete('/users/:id', async (req, res) => {
  if (req.user._id.equals(req.params.id)) return res.status(400).json({ error: 'You cannot delete yourself.' })

  for (const group of await Group.find({ owner: req.params.id })) await removeGroup(group, group.owner)
  await Group.updateMany({}, { $pull: { members: req.params.id } })
  await Order.deleteMany({ account: req.params.id })
  await Review.deleteMany({ user: req.params.id })
  await User.findByIdAndDelete(req.params.id)
  res.json({ deleted: true })
})

// All groups with their members
router.get('/groups', async (_req, res) => {
  const groups = await Group.find().sort({ createdAt: -1 }).populate('owner members', 'name email phone')
  res.json({ groups })
})

/* ---------------------------------------------------------------- Orders */

// What to cook on a day (default today): a kitchen list (dish × qty per meal),
// and each group's and person's order. Future days show plans + changes so far.
router.get('/orders', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  if (date <= today()) await catchUp()

  const [orders, guestOrders, users, groups, dishes, settings] = await Promise.all([
    Order.find({ date }),
    GuestOrder.find({ date }).sort({ createdAt: 1 }),
    User.find({ role: 'user' }),
    Group.find(),
    Dish.find({ date }).sort({ createdAt: 1 }),
    getSettings(),
  ])
  const byId = (list, id) => list.find((x) => x._id.equals(id))

  // Future days: add the plan orders that will be created (accounts without an order yet).
  const all = orders.map((o) => o.toObject())
  if (date > today()) {
    const inGroup = new Set(groups.flatMap((g) => g.members.map(String)))
    const eats = (u) => u.active && startOf(u) <= date
    const plan = (account, kind, people) => {
      if (all.some((o) => o.account.equals(account))) return
      const items = MEALS.flatMap((meal) => {
        const qty = people.filter((u) => eats(u) && u.meals.includes(meal)).length
        const dish = dishes.find((d) => d.meal === meal)
        const price = dish?.price > 0 ? dish.price : settings.prices[meal]
        return qty
          ? [
              {
                meal,
                dish: dish?._id ?? null,
                name: dish?.name ?? `${meal[0].toUpperCase()}${meal.slice(1)} tiffin`,
                price,
                qty,
              },
            ]
          : []
      })
      if (items.length)
        all.push({ account, kind, items, amount: items.reduce((s, i) => s + i.price * i.qty, 0), planned: true })
    }
    for (const u of users) if (!inGroup.has(String(u._id))) plan(u._id, 'user', [u])
    for (const g of groups)
      plan(
        g._id,
        'group',
        users.filter((u) => g.members.some((m) => m.equals(u._id))),
      )
  }

  // Non-membership (WhatsApp) orders are cooked unless cancelled, but only paid ones count as money.
  const guests = guestOrders.filter((g) => g.status !== 'cancelled')
  const guestPaid = guestOrders.filter((g) => g.status === 'paid').reduce((s, g) => s + g.amount, 0)

  // Kitchen list: how many of each dish, per meal.
  const kitchen = {}
  for (const o of [...all, ...guests]) {
    for (const i of o.items) {
      const key = `${i.meal}|${i.name}`
      kitchen[key] = kitchen[key] ?? { meal: i.meal, name: i.name, qty: 0 }
      kitchen[key].qty += i.qty
    }
  }
  const order = ['breakfast', 'lunch', 'dinner', 'special']
  const total = Object.fromEntries(
    [...MEALS, 'special'].map((meal) => [
      meal,
      [...all, ...guests].reduce(
        (s, o) => s + o.items.filter((i) => i.meal === meal).reduce((t, i) => t + i.qty, 0),
        0,
      ),
    ]),
  )

  const rows = all
    .map((o) => {
      const who = o.kind === 'group' ? byId(groups, o.account) : byId(users, o.account)
      return {
        _id: o.account,
        kind: o.kind,
        name: who?.name ?? 'Deleted',
        phone: o.kind === 'user' ? who?.phone : undefined,
        people: o.kind === 'group' ? who?.members.length : 1,
        items: o.items.map(({ meal, name, price, qty }) => ({ meal, name, price, qty })),
        amount: o.amount,
        changed: Boolean(o.custom),
      }
    })
    .filter((r) => r.items.length)
    .sort((a, b) => a.name.localeCompare(b.name))

  res.json({
    date,
    total,
    kitchen: Object.values(kitchen).sort((a, b) => order.indexOf(a.meal) - order.indexOf(b.meal) || b.qty - a.qty),
    amount: rows.reduce((s, r) => s + r.amount, 0), // members' bills
    guestPaid,
    groups: rows.filter((r) => r.kind === 'group'),
    individuals: rows.filter((r) => r.kind === 'user'),
    guests: guestOrders.map((g) => ({
      _id: g._id,
      code: g.code,
      name: g.name,
      phone: g.phone,
      items: g.items.map(({ meal, name, price, qty }) => ({ meal, name, price, qty })),
      amount: g.amount,
      delivery: g.delivery,
      address: g.address,
      note: g.note,
      status: g.status,
      paidAt: g.paidAt,
      createdAt: g.createdAt,
    })),
  })
})

// Move a non-membership (WhatsApp) order along: { status: 'new' | 'confirmed' | 'paid' | 'cancelled', amount? }
// 'paid' = the admin checked the money came in; `amount` is the final price agreed on WhatsApp.
router.patch('/guest-orders/:id', async (req, res) => {
  const { status } = req.body
  if (!['new', 'confirmed', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Pick a status.' })
  }
  const order = await GuestOrder.findById(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (status === 'paid') {
    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount)
      if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
        return res.status(400).json({ error: 'Enter the amount paid.' })
      }
      order.amount = Math.round(amount)
    }
    order.paidAt = order.paidAt ?? new Date()
  } else order.paidAt = null
  order.status = status
  await order.save()
  res.json({ order: { _id: order._id, status: order.status, amount: order.amount, paidAt: order.paidAt } })
})

// Tiffins per day for the whole mess, for the heatmap (default last 26 weeks).
router.get('/history', async (req, res) => {
  await catchUp()
  const days = Math.min(Number(req.query.days) || 182, 400)
  const range = { date: { $gte: addDays(today(), 1 - days), $lte: today() } }
  const [orders, guests] = await Promise.all([
    Order.find(range),
    GuestOrder.find({ ...range, status: 'paid' }), // non-membership orders count once paid
  ])
  res.json({ days: perDay([...orders, ...guests]) })
})

// The month's register: every customer, what they ate each day, and their bill. ?month=YYYY-MM
router.get('/month', async (req, res) => {
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month) ? req.query.month : today().slice(0, 7)
  res.json(await monthSheet(month))
})

/* ----------------------------------------------------------------- Money */

// What every group and individual owes.
router.get('/dues', async (_req, res) => {
  const [dues, [guests]] = await Promise.all([
    allDues(),
    GuestOrder.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, amount: { $sum: '$amount' }, orders: { $sum: 1 } } },
    ]),
  ])
  // Non-membership orders are paid in full before they count, so they never have anything pending.
  res.json({ dues, guests: { amount: guests?.amount ?? 0, orders: guests?.orders ?? 0 } })
})

router.get('/prices', async (_req, res) => {
  const { prices, cutoffs } = await getSettings()
  res.json({ prices, cutoffs })
})

// Set standard prices and order cut-off times:
// { prices: { breakfast, lunch, dinner }, cutoffs: { breakfast: '07:00', lunch: '11:00', dinner: '18:00' } }
router.put('/prices', async (req, res) => {
  const settings = await getSettings()
  for (const meal of MEALS) {
    const price = Number(req.body.prices?.[meal])
    if (!(price >= 0)) return res.status(400).json({ error: `Enter a price for ${meal}.` })
    settings.prices[meal] = price
    const time = req.body.cutoffs?.[meal]
    if (time !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ error: `Enter a time for ${meal}.` })
      settings.cutoffs[meal] = time
    }
  }
  await settings.save()
  await applyPrices(settings.prices) // today and later; past days keep their old price
  res.json({ prices: settings.prices, cutoffs: settings.cutoffs })
})

export default router

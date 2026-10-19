import { Router } from 'express'
import Group from '../models/Group.js'
import Order from '../models/Order.js'
import { loggedIn } from '../auth.js'
import { accountSummary, addDays, catchUp, dayFor, isDate, perDay, saveDay, today } from '../tiffins.js'

const router = Router()
router.use(loggedIn)

// The cart for a day (default today): menu options, prices, my (or my group's) order, cut-offs.
router.get('/', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today()
  res.json(await dayFor(req.user, date))
})

// Place / update the order: { date, items: [{ meal, dish, qty }] }.
// In a group, only the owner can do this (it is one order for the whole group).
router.put('/', async (req, res) => {
  const { locked } = await saveDay(req.user, req.body.date, req.body.items)
  res.json({ ...(await dayFor(req.user, req.body.date)), lockedNow: locked })
})

// Days taken, tiffins, charges, paid and pending: mine and my group's.
router.get('/account', async (req, res) => {
  res.json(await accountSummary(req.user))
})

// Tiffins per day for my heatmap (my own orders + my group's), default last 26 weeks.
router.get('/history', async (req, res) => {
  await catchUp()
  const days = Math.min(Number(req.query.days) || 182, 400)
  const group = await Group.findOne({ members: req.user._id })
  const orders = await Order.find({
    account: { $in: [req.user._id, ...(group ? [group._id] : [])] },
    date: { $gte: addDays(today(), 1 - days), $lte: today() },
  })
  res.json({ days: perDay(orders) })
})

export default router

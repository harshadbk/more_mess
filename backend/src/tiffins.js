// Daily tiffin records and money: the "brain" of the mess.
import Group from './models/Group.js'
import Order from './models/Order.js'
import Payment from './models/Payment.js'
import Settings from './models/Settings.js'
import User from './models/User.js'

export const MEALS = ['breakfast', 'lunch', 'dinner']

/* ----------------------------------------------------------------- Dates */

// Dates are 'YYYY-MM-DD' strings in India time, so they sort and compare as text.
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
export const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/* ---------------------------------------------------------------- Prices */

export async function getSettings() {
  return (await Settings.findOne()) ?? (await Settings.create({}))
}

// ₹ for one day: meal prices + special dishes.
export function orderAmount(order, prices) {
  const meals = MEALS.reduce((sum, meal) => sum + (order[meal] ? prices[meal] || 0 : 0), 0)
  const specials = (order.specials || []).reduce((sum, s) => sum + s.price * s.qty, 0)
  return meals + specials
}

/* ----------------------------------------------------------- Daily records */

// { breakfast: false, lunch: true, dinner: true } from the user's plan.
export const planMeals = (user) => Object.fromEntries(MEALS.map((meal) => [meal, user.meals.includes(meal)]))

// The first day a customer's tiffins are counted automatically.
export const startOf = (user) =>
  user.startDate || addDays(user.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), 1)

// Creates the plan-based record for every active customer, for each day from `from` to `to`,
// unless they already have one (e.g. they changed that day themselves).
async function fillOrders(from, to) {
  const users = await User.find({ role: 'user', active: true })
  const { prices } = await getSettings()
  const existing = await Order.find({ date: { $gte: from, $lte: to } }, 'user date')
  const have = new Set(existing.map((o) => `${o.user}|${o.date}`))

  const records = []
  for (let date = from; date <= to; date = addDays(date, 1)) {
    for (const user of users) {
      if (startOf(user) > date || have.has(`${user._id}|${date}`)) continue
      const meals = planMeals(user)
      records.push({ user: user._id, date, ...meals, amount: orderAmount(meals, prices) })
    }
  }
  // ordered: false = skip duplicates if two requests fill the same day at the same time
  if (records.length) await Order.insertMany(records, { ordered: false }).catch(ignoreDuplicates)
}

const ignoreDuplicates = (err) => {
  if (err.code !== 11000 && !err.writeErrors?.every((e) => e.code === 11000)) throw err
}

// Makes sure daily records exist up to today. Cheap to call often: it remembers the last day done.
export async function catchUp() {
  const settings = await getSettings()
  const end = today()
  if (settings.filledUpTo >= end) return
  const from = settings.filledUpTo ? addDays(settings.filledUpTo, 1) : end
  await fillOrders(from < addDays(end, -60) ? addDays(end, -60) : from, end)
  settings.filledUpTo = end
  await settings.save()
}

// A customer's tiffins for a day: their saved record, or their plan (nothing if their
// daily tiffins haven't started yet on that day, e.g. sign-up day, or they left the mess).
export async function dayFor(user, date) {
  if (date <= today()) await catchUp()
  const order = await Order.findOne({ user: user._id, date })
  if (order) return order
  const started = user.active && startOf(user) <= date
  const meals = started ? planMeals(user) : { breakfast: false, lunch: false, dinner: false }
  return { date, ...meals, specials: [], custom: false, planned: true, startsOn: started ? null : startOf(user) }
}

/* ----------------------------------------------------------------- Money */

const AGREED = { rejected: false, adminConfirmed: true, customerConfirmed: true }

// Days taken, tiffins, charges, paid and pending for a list of orders and agreed payments.
export function summarize(orders, payments) {
  const days = new Set()
  let tiffins = 0
  let specials = 0
  let charges = 0
  for (const o of orders) {
    const meals = MEALS.filter((meal) => o[meal]).length
    const extra = o.specials.reduce((sum, s) => sum + s.qty, 0)
    if (meals || extra) days.add(o.date)
    tiffins += meals
    specials += extra
    charges += o.amount
  }
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  return { daysTaken: days.size, tiffins, specials, charges, paid, pending: charges - paid }
}

// A customer's own account, plus their group's (groups pay together).
export async function accountOf(user) {
  await catchUp()
  const group = await Group.findOne({ members: user._id })
  const ids = group ? group.members : [user._id]
  const orders = await Order.find({ user: { $in: ids }, date: { $lte: today() } })
  const payments = await Payment.find({
    ...AGREED,
    $or: [{ user: { $in: ids } }, ...(group ? [{ group: group._id }] : [])],
  })
  const mine = summarize(
    orders.filter((o) => o.user.equals(user._id)),
    payments.filter((p) => p.user?.equals(user._id)),
  )
  return { me: mine, group: group ? { name: group.name, ...summarize(orders, payments) } : null }
}

// Every group and every individual customer with what they owe (for the admin).
export async function allDues() {
  await catchUp()
  const [groups, users, orders, payments] = await Promise.all([
    Group.find().sort({ name: 1 }),
    User.find({ role: 'user' }).sort({ name: 1 }),
    Order.find({ date: { $lte: today() } }),
    Payment.find(AGREED),
  ])
  const inGroup = new Set(groups.flatMap((g) => g.members.map(String)))

  const groupRows = groups.map((g) => {
    const ids = new Set(g.members.map(String))
    return {
      type: 'group',
      _id: g._id,
      name: g.name,
      people: g.members.length,
      ...summarize(
        orders.filter((o) => ids.has(String(o.user))),
        payments.filter((p) => String(p.group) === String(g._id) || ids.has(String(p.user))),
      ),
    }
  })
  const userRows = users
    .filter((u) => !inGroup.has(String(u._id)))
    .map((u) => ({
      type: 'individual',
      _id: u._id,
      name: u.name,
      phone: u.phone,
      active: u.active,
      ...summarize(
        orders.filter((o) => o.user.equals(u._id)),
        payments.filter((p) => p.user?.equals(u._id)),
      ),
    }))
  return [...groupRows, ...userRows]
}

// Tiffins and ₹ per day, for heatmaps: [{ date, tiffins, specials, amount }]
export function perDay(orders) {
  const days = new Map()
  for (const o of orders) {
    const day = days.get(o.date) ?? { date: o.date, tiffins: 0, specials: 0, amount: 0 }
    day.tiffins += MEALS.filter((meal) => o[meal]).length
    day.specials += o.specials.reduce((sum, s) => sum + s.qty, 0)
    day.amount += o.amount
    days.set(o.date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/* ------------------------------------------------------------ Old data */

// Older accounts saved meals as 'lunch' / 'dinner' / 'both'. Convert them to the new list form.
export async function fixOldData() {
  const old = { both: ['lunch', 'dinner'], lunch: ['lunch'], dinner: ['dinner'] }
  for (const [value, meals] of Object.entries(old)) {
    // "not an array" so new-style lists like ['breakfast', 'lunch'] are never touched
    await User.collection.updateMany(
      { $and: [{ meals: value }, { meals: { $not: { $type: 'array' } } }] },
      { $set: { meals } },
    )
  }
}

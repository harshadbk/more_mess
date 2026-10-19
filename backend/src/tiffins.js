// Daily orders (carts) and money: the "brain" of the mess.
//
// Every day each "account" gets one order:
//   - a person eating alone  -> their order, from their plan (user.meals)
//   - a group                -> ONE order for everyone, 1 tiffin per member who takes that meal.
//                               Only the group's owner can change it (e.g. "only 6 eat lunch today").
// An order is a list of items: { meal, dish, name, price, qty }. The bill is sum(price × qty).
import Dish from './models/Dish.js'
import Group from './models/Group.js'
import Order from './models/Order.js'
import Payment from './models/Payment.js'
import Settings from './models/Settings.js'
import User from './models/User.js'

export const MEALS = ['breakfast', 'lunch', 'dinner']
const LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

const fail = (status, message) => Object.assign(new Error(message), { status })

/* ----------------------------------------------------------------- Dates */

// Dates are 'YYYY-MM-DD' strings in India time, so they sort and compare as text.
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
export const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const nowTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).slice(0, 5)

/* -------------------------------------------------------------- Settings */

export async function getSettings() {
  return (await Settings.findOne()) ?? (await Settings.create({}))
}

// Meals that can no longer be changed on `date` (past days: all; today: after each cut-off time).
export function lockedMeals(date, cutoffs) {
  if (date > today()) return []
  if (date < today()) return [...MEALS, 'special']
  const now = nowTime()
  const locked = MEALS.filter((meal) => now >= cutoffs[meal])
  if (now >= cutoffs.dinner) locked.push('special')
  return locked
}

// A menu is only good until each meal's cut-off: dishes from past days and today's closed meals
// are deleted. Orders keep their own copy of each dish's name and price, so bills don't change.
export async function dropExpiredDishes() {
  const { cutoffs } = await getSettings()
  const date = today()
  await Dish.deleteMany({ $or: [{ date: { $lt: date } }, { date, meal: { $in: lockedMeals(date, cutoffs) } }] })
}

/* ----------------------------------------------------------------- Items */

export const itemsAmount = (items) => items.reduce((sum, i) => sum + i.price * i.qty, 0)

// One cart line for a dish (or the plain "Lunch tiffin" when no dish is chosen/posted).
function itemFor(meal, dish, qty, prices) {
  if (!dish) return { meal, dish: null, name: `${LABEL[meal]} tiffin`, price: prices[meal] || 0, base: true, qty }
  const own = dish.price > 0
  return { meal, dish: dish._id, name: dish.name, price: own ? dish.price : prices[meal] || 0, base: !own, qty }
}

// Plan items from meal counts like { lunch: 5, dinner: 3 }: the first posted option for each meal.
function planItems(counts, dishes, prices) {
  return MEALS.filter((meal) => counts[meal] > 0).map((meal) =>
    itemFor(
      meal,
      dishes.find((d) => d.meal === meal),
      counts[meal],
      prices,
    ),
  )
}

/* -------------------------------------------------------------- Accounts */

// The first day a customer's daily tiffins start automatically.
export const startOf = (user) =>
  user.startDate || addDays(user.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), 1)

const eats = (user, date) => user.role === 'user' && user.active && startOf(user) <= date

// How many of these people take each meal on `date`, from their plans.
const mealCounts = (people, date) =>
  Object.fromEntries(MEALS.map((meal) => [meal, people.filter((u) => eats(u, date) && u.meals.includes(meal)).length]))

// The account a user orders under: their group if they are in one, otherwise themselves.
export async function accountOf(user) {
  const group = await Group.findOne({ members: user._id })
  if (!group) return { kind: 'user', id: user._id, name: user.name, canEdit: true, people: 1 }
  return {
    kind: 'group',
    id: group._id,
    group,
    name: group.name,
    canEdit: group.owner.equals(user._id),
    people: group.members.length,
  }
}

/* ----------------------------------------------------------- Daily orders */

// Creates the plan order for every account, for each day from `from` to `to`, unless one exists.
async function fillOrders(from, to) {
  const [users, groups, { prices }] = await Promise.all([User.find({ role: 'user' }), Group.find(), getSettings()])
  const inGroup = new Set(groups.flatMap((g) => g.members.map(String)))
  const existing = await Order.find({ date: { $gte: from, $lte: to } }, 'account date')
  const have = new Set(existing.map((o) => `${o.account}|${o.date}`))

  const records = []
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const dishes = await Dish.find({ date }).sort({ createdAt: 1 })
    const add = (kind, account, people) => {
      if (have.has(`${account}|${date}`)) return
      const items = planItems(mealCounts(people, date), dishes, prices)
      if (items.length) records.push({ kind, account, date, items, amount: itemsAmount(items) })
    }
    for (const u of users) if (!inGroup.has(String(u._id))) add('user', u._id, [u])
    for (const g of groups) {
      // A group's automatic orders start the day after it was created (no double counting on day one).
      if (g.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) >= date) continue
      add(
        'group',
        g._id,
        users.filter((u) => g.members.some((m) => m.equals(u._id))),
      )
    }
  }
  // ordered: false = skip duplicates if two requests fill the same day at the same time
  if (records.length) await Order.insertMany(records, { ordered: false }).catch(ignoreDuplicates)
}

const ignoreDuplicates = (err) => {
  if (err.code !== 11000 && !err.writeErrors?.every((e) => e.code === 11000)) throw err
}

// Makes sure daily orders exist up to today. Cheap to call often: it remembers the last day done.
export async function catchUp() {
  const settings = await getSettings()
  const end = today()
  if (settings.filledUpTo >= end) return
  const from = settings.filledUpTo ? addDays(settings.filledUpTo, 1) : end
  await fillOrders(from < addDays(end, -60) ? addDays(end, -60) : from, end)
  settings.filledUpTo = end
  await settings.save()
}

// Everything the cart screen needs for one day.
export async function dayFor(user, date) {
  if (date <= today()) await Promise.all([catchUp(), dropExpiredDishes()])
  const [acc, settings, dishes] = await Promise.all([
    accountOf(user),
    getSettings(),
    Dish.find({ date }).sort({ createdAt: 1 }),
  ])
  let order = await Order.findOne({ account: acc.id, date })
  let startsOn = null

  if (!order) {
    // Today/past with no order = daily tiffins hadn't started yet (new member or new group): empty cart.
    // Future day = what the plan(s) will give.
    let items = []
    if (date > today()) {
      const people = acc.kind === 'group' ? await User.find({ _id: { $in: acc.group.members } }) : [user]
      items = planItems(mealCounts(people, date), dishes, settings.prices)
      if (acc.kind === 'group' && acc.group.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) >= date)
        items = []
    }
    if (!items.length && user.active)
      startsOn = acc.kind === 'user' && startOf(user) > date ? startOf(user) : addDays(today(), 1)
    order = { items, custom: false, planned: true, amount: itemsAmount(items) }
  }

  return {
    date,
    account: { kind: acc.kind, name: acc.name, canEdit: acc.canEdit, people: acc.people },
    order: { items: order.items, custom: order.custom, planned: Boolean(order.planned), amount: order.amount },
    startsOn: order.items.length ? null : startsOn,
    dishes,
    prices: settings.prices,
    cutoffs: settings.cutoffs,
    locked: lockedMeals(date, settings.cutoffs),
  }
}

// Save the cart for a day: items = [{ meal, dish (id or null), qty }].
export async function saveDay(user, date, rawItems = []) {
  if (!isDate(date)) throw fail(400, 'Pick a date.')
  if (date < today()) throw fail(400, 'You cannot change a past day.')
  const acc = await accountOf(user)
  if (!acc.canEdit) throw fail(403, "Only the group's owner can change the group's order.")

  const [settings, dishes, existing] = await Promise.all([
    getSettings(),
    Dish.find({ date }),
    Order.findOne({ account: acc.id, date }),
  ])
  const locked = lockedMeals(date, settings.cutoffs)
  const max = acc.kind === 'group' ? 100 : 10

  // Locked meals keep what they had; the rest come from the cart.
  const items = (existing?.items ?? []).filter((i) => locked.includes(i.meal)).map((i) => i.toObject())
  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    const qty = Math.min(max, Math.floor(Number(raw.qty) || 0))
    const meal = raw.meal
    if (qty < 1 || locked.includes(meal) || ![...MEALS, 'special'].includes(meal)) continue
    let dish = null
    if (raw.dish) {
      dish = dishes.find((d) => d._id.equals(raw.dish) && d.meal === meal)
      if (!dish) continue // not on that day's menu
    } else if (meal === 'special') continue // specials must be a real dish
    const same = items.find((i) => i.meal === meal && String(i.dish) === String(dish?._id ?? null))
    if (same) same.qty = Math.min(max, same.qty + qty)
    else items.push(itemFor(meal, dish, qty, settings.prices))
  }

  const order = await Order.findOneAndUpdate(
    { account: acc.id, date },
    { kind: acc.kind, items, custom: true, amount: itemsAmount(items) },
    { upsert: true, new: true },
  )
  return { order, locked }
}

// After the admin changes the menu for a day (today or later), bring that day's orders in line:
// plain "Lunch tiffin" lines get the first posted lunch option, lines for a removed dish move to
// another option (or back to plain), specials that were removed drop out, and prices are refreshed.
// Meals past their cut-off are left alone (their dishes may already be deleted).
export async function syncMenuDay(date) {
  if (date < today()) return // past bills never change
  const [dishes, { prices, cutoffs }, orders] = await Promise.all([
    Dish.find({ date }).sort({ createdAt: 1 }),
    getSettings(),
    Order.find({ date }),
  ])
  const locked = lockedMeals(date, cutoffs)
  for (const order of orders) {
    const items = []
    for (const item of order.items) {
      if (locked.includes(item.meal)) {
        items.push(item.toObject())
        continue
      }
      let dish = item.dish && dishes.find((d) => d._id.equals(item.dish) && d.meal === item.meal)
      if (!dish && item.meal === 'special') continue // that special is gone
      if (!dish) dish = dishes.find((d) => d.meal === item.meal) // first option, or none
      const next = itemFor(item.meal, dish ?? null, item.qty, prices)
      const same = items.find((i) => i.meal === next.meal && String(i.dish) === String(next.dish))
      if (same) same.qty += next.qty
      else items.push(next)
    }
    order.items = items
    order.amount = itemsAmount(items)
    await order.save()
  }
}

// syncMenuDay for today and every later day that has a menu (used at startup).
export async function syncUpcomingMenus() {
  const dates = await Dish.distinct('date', { date: { $gte: today() } })
  for (const date of new Set([today(), ...dates])) await syncMenuDay(date)
}

// New standard prices apply from today on; past days keep the price they had.
export async function applyPrices(prices) {
  const upcoming = await Order.find({ date: { $gte: today() } })
  for (const order of upcoming) {
    for (const item of order.items) if (item.base && item.meal !== 'special') item.price = prices[item.meal] || 0
    order.amount = itemsAmount(order.items)
    await order.save()
  }
}

// A person who joins a group stops their own orders from tomorrow (the group's order covers them).
export const dropOwnFutureOrders = (userId) => Order.deleteMany({ account: userId, date: { $gt: today() } })

/* ----------------------------------------------------------------- Money */

const AGREED = { rejected: false, adminConfirmed: true, customerConfirmed: true }

const countOf = (order) => {
  let tiffins = 0
  let specials = 0
  for (const i of order.items) {
    if (i.meal === 'special') specials += i.qty
    else tiffins += i.qty
  }
  return { tiffins, specials }
}

// Days taken, tiffins, charges, paid and pending for a list of orders and agreed payments.
export function summarize(orders, payments) {
  const days = new Set()
  let tiffins = 0
  let specials = 0
  let charges = 0
  for (const o of orders) {
    const c = countOf(o)
    if (c.tiffins || c.specials) days.add(o.date)
    tiffins += c.tiffins
    specials += c.specials
    charges += o.amount
  }
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  return { daysTaken: days.size, tiffins, specials, charges, paid, pending: charges - paid }
}

// A customer's own account (times they ate alone) and their group's account.
export async function accountSummary(user) {
  await catchUp()
  const group = await Group.findOne({ members: user._id })
  const [myOrders, myPayments] = await Promise.all([
    Order.find({ account: user._id, date: { $lte: today() } }),
    Payment.find({ ...AGREED, user: user._id }),
  ])
  let groupSummary = null
  if (group) {
    const [orders, payments] = await Promise.all([
      Order.find({ account: group._id, date: { $lte: today() } }),
      Payment.find({ ...AGREED, group: group._id }),
    ])
    groupSummary = { name: group.name, people: group.members.length, ...summarize(orders, payments) }
  }
  return { me: summarize(myOrders, myPayments), group: groupSummary }
}

// Every group and every person with what they owe (for the admin).
export async function allDues() {
  await catchUp()
  const [groups, users, orders, payments] = await Promise.all([
    Group.find().sort({ name: 1 }),
    User.find({ role: 'user' }).sort({ name: 1 }),
    Order.find({ date: { $lte: today() } }),
    Payment.find(AGREED),
  ])
  const groupOf = (u) => groups.find((g) => g.members.some((m) => m.equals(u._id)))

  const groupRows = groups.map((g) => ({
    type: 'group',
    _id: g._id,
    name: g.name,
    people: g.members.length,
    ...summarize(
      orders.filter((o) => o.account.equals(g._id)),
      payments.filter((p) => p.group?.equals(g._id)),
    ),
  }))
  const userRows = users
    .map((u) => ({
      type: 'individual',
      _id: u._id,
      name: u.name,
      phone: u.phone,
      active: u.active,
      group: groupOf(u)?.name ?? null,
      ...summarize(
        orders.filter((o) => o.account.equals(u._id)),
        payments.filter((p) => p.user?.equals(u._id)),
      ),
    }))
    // Group members only get their own row if they have their own bill (from before joining).
    .filter((r) => !r.group || r.charges || r.paid)
  return [...groupRows, ...userRows]
}

// Tiffins and ₹ per day, for heatmaps: [{ date, tiffins, specials, amount }]
export function perDay(orders) {
  const days = new Map()
  for (const o of orders) {
    const day = days.get(o.date) ?? { date: o.date, tiffins: 0, specials: 0, amount: 0 }
    const c = countOf(o)
    day.tiffins += c.tiffins
    day.specials += c.specials
    day.amount += o.amount
    days.set(o.date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/* ---------------------------------------------------------------- Groups */

// Deletes a group without losing money: its orders (the bill) and payments move to one member
// (the owner, or another member if `leaving` is the owner being deleted).
export async function removeGroup(group, leaving = null) {
  const heir = [group.owner, ...group.members].find((id) => !leaving || !id.equals(leaving))
  if (heir) {
    for (const order of await Order.find({ account: group._id })) {
      const mine = await Order.findOne({ account: heir, date: order.date })
      if (mine) {
        mine.items.push(...order.items.map((i) => i.toObject()))
        mine.amount = itemsAmount(mine.items)
        await mine.save()
        await order.deleteOne()
      } else {
        order.account = heir
        order.kind = 'user'
        await order.save()
      }
    }
    await Payment.updateMany({ group: group._id }, { $set: { user: heir }, $unset: { group: 1 } })
  } else {
    await Order.deleteMany({ account: group._id })
  }
  await group.deleteOne()
}

/* ------------------------------------------------------------ Old data */

// Converts data saved by older versions of this app. Safe to run on every start.
export async function fixOldData() {
  // Meals saved as 'lunch' / 'dinner' / 'both' -> lists. ("not an array" so new lists are never touched.)
  const old = { both: ['lunch', 'dinner'], lunch: ['lunch'], dinner: ['dinner'] }
  for (const [value, meals] of Object.entries(old)) {
    await User.collection.updateMany(
      { $and: [{ meals: value }, { meals: { $not: { $type: 'array' } } }] },
      { $set: { meals } },
    )
  }

  // Orders saved per user with yes/no meals -> carts with items.
  const { prices } = await getSettings()
  const oldOrders = await Order.collection.find({ user: { $exists: true } }).toArray()
  for (const o of oldOrders) {
    const items = [
      ...MEALS.filter((meal) => o[meal]).map((meal) => itemFor(meal, null, 1, prices)),
      ...(o.specials ?? []).map((s) => ({
        meal: 'special',
        dish: s.dish,
        name: s.name,
        price: s.price,
        base: false,
        qty: s.qty,
      })),
    ]
    await Order.collection.updateOne(
      { _id: o._id },
      {
        $set: { account: o.user, kind: 'user', items },
        $unset: { user: 1, breakfast: 1, lunch: 1, dinner: 1, specials: 1 },
      },
    )
  }
  await Order.syncIndexes() // drop the old (user, date) index and make sure the new ones exist
}

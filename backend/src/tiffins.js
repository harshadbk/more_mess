// Daily orders (carts) and money: the "brain" of the mess.
//
// Every day each "account" gets one order:
//   - a person eating alone  -> their order, from their plan (user.meals)
//   - a group                -> ONE order for everyone, 1 tiffin per member who takes that meal.
//                               Only the group's owner can change it (e.g. "only 6 eat lunch today").
// An order is a list of items: { meal, dish, name, food, price, qty }. The bill is sum(price × qty).
// For breakfast, lunch and dinner an order has ONE option per meal (a group: the same option for
// everyone eating it, with the members who eat it ticked). Specials are extras and can be mixed.
// Inside a group, the bill is split by those ticks (see splitOrder); the owner pays the mess and
// records what each member paid them (MemberPayment).
// Non-veg is only served on Sundays and Wednesdays.
import Dish from './models/Dish.js'
import Group from './models/Group.js'
import GuestOrder from './models/GuestOrder.js'
import MemberPayment from './models/MemberPayment.js'
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
// Sunday (0) and Wednesday (3) are the only non-veg days.
export const nonVegDay = (date) => [0, 3].includes(new Date(`${date}T00:00:00Z`).getUTCDay())

// The dishes that can actually be served on `date` (non-veg dishes only on non-veg days).
export const servedDishes = (dishes, date) => dishes.filter((d) => d.food !== 'non-veg' || nonVegDay(date))

// Orders can be placed up to this many days ahead.
export const DAYS_AHEAD = 30

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
export function itemFor(meal, dish, qty, prices, food = 'veg') {
  if (!dish) return { meal, dish: null, name: `${LABEL[meal]} tiffin`, food, price: prices[meal] || 0, base: true, qty }
  const own = dish.price > 0
  const price = own ? dish.price : prices[meal] || 0
  return { meal, dish: dish._id, name: dish.name, food: dish.food, price, base: !own, qty }
}

// The option someone gets when they haven't picked one: the first posted dish of their kind
// (non-veg eaters get non-veg on non-veg days), otherwise the first veg dish, otherwise any.
// `dishes` must already be the served ones for that day.
function defaultDish(dishes, meal, food = 'veg') {
  const options = dishes.filter((d) => d.meal === meal)
  const want = food === 'non-veg' ? 'non-veg' : 'veg'
  return options.find((d) => d.food === want) ?? options.find((d) => d.food !== 'non-veg') ?? options[0]
}

// Plan items for these people on `date`: the default option for each meal, 1 tiffin per person who
// takes it. For a group, the eaters are ticked on each line.
function planItems(people, date, dishes, prices, food = 'veg', group = false) {
  return MEALS.map((meal) => [meal, people.filter((u) => eats(u, date) && u.meals.includes(meal))])
    .filter(([, eaters]) => eaters.length)
    .map(([meal, eaters]) => ({
      ...itemFor(meal, defaultDish(dishes, meal, food), eaters.length, prices),
      ...(group ? { members: eaters.map((u) => u._id) } : {}),
    }))
}

/* -------------------------------------------------------------- Accounts */

// The first day a customer's daily tiffins start automatically.
export const startOf = (user) =>
  user.startDate || addDays(user.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), 1)

const eats = (user, date) => user.role === 'user' && user.active && startOf(user) <= date

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
    const dishes = servedDishes(await Dish.find({ date }).sort({ createdAt: 1 }), date)
    const add = (kind, account, people, food) => {
      if (have.has(`${account}|${date}`)) return
      const items = planItems(people, date, dishes, prices, food, kind === 'group')
      if (items.length) records.push({ kind, account, date, items, amount: itemsAmount(items) })
    }
    for (const u of users) if (!inGroup.has(String(u._id))) add('user', u._id, [u], u.foodPreference)
    for (const g of groups) {
      // A group's automatic orders start the day after it was created (no double counting on day one).
      if (g.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) >= date) continue
      // A group starts on veg; its owner switches the whole group to non-veg on non-veg days.
      add(
        'group',
        g._id,
        users.filter((u) => g.members.some((m) => m.equals(u._id))),
        'veg',
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
  const [acc, settings, allDishes] = await Promise.all([
    accountOf(user),
    getSettings(),
    Dish.find({ date }).sort({ createdAt: 1 }),
  ])
  const dishes = servedDishes(allDishes, date)
  const food = acc.kind === 'group' ? 'veg' : user.foodPreference
  let order = await Order.findOne({ account: acc.id, date })
  let startsOn = null
  const people = acc.kind === 'group' ? await User.find({ _id: { $in: acc.group.members } }).sort({ name: 1 }) : [user]

  if (!order) {
    // Today/past with no order = daily tiffins hadn't started yet (new member or new group): empty cart.
    // Future day = what the plan(s) will give.
    let items = []
    if (date > today()) {
      items = planItems(people, date, dishes, settings.prices, food, acc.kind === 'group')
      if (acc.kind === 'group' && acc.group.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) >= date)
        items = []
    }
    if (!items.length && user.active)
      startsOn = acc.kind === 'user' && startOf(user) > date ? startOf(user) : addDays(today(), 1)
    order = { items, custom: false, planned: true, amount: itemsAmount(items) }
  }

  // On non-veg days the group's owner sees how many members prefer non-veg, to pick for everyone.
  const nonVegMembers = acc.kind === 'group' ? people.filter((u) => u.foodPreference === 'non-veg').length : 0

  return {
    date,
    account: {
      kind: acc.kind,
      name: acc.name,
      canEdit: acc.canEdit,
      people: acc.people,
      nonVegMembers,
      // A group's members, for ticking who eats each meal.
      members:
        acc.kind === 'group'
          ? people.map((u) => ({ _id: u._id, name: u.name, foodPreference: u.foodPreference, meals: u.meals }))
          : [],
    },
    order: { items: order.items, custom: order.custom, planned: Boolean(order.planned), amount: order.amount },
    startsOn: order.items.length ? null : startsOn,
    dishes,
    nonVegDay: nonVegDay(date),
    prices: settings.prices,
    cutoffs: settings.cutoffs,
    locked: lockedMeals(date, settings.cutoffs),
  }
}

// Save the cart for a day: items = [{ meal, dish (id or null), qty, members? }].
// Breakfast, lunch and dinner: one option each, 1 tiffin for a person. A group sends `members` (the ticked
// members eating that meal) and gets one tiffin each.
export async function saveDay(user, date, rawItems = []) {
  if (!isDate(date)) throw fail(400, 'Pick a date.')
  if (date < today()) throw fail(400, 'You cannot change a past day.')
  if (date > addDays(today(), DAYS_AHEAD)) throw fail(400, `You can order up to ${DAYS_AHEAD} days ahead.`)
  const acc = await accountOf(user)
  if (!acc.canEdit) throw fail(403, "Only the group's owner can change the group's order.")

  const [settings, allDishes, existing] = await Promise.all([
    getSettings(),
    Dish.find({ date }),
    Order.findOne({ account: acc.id, date }),
  ])
  const dishes = servedDishes(allDishes, date)
  const locked = lockedMeals(date, settings.cutoffs)
  const maxOf = (meal) => (meal === 'special' ? (acc.kind === 'group' ? 100 : 10) : acc.people)

  // Locked meals keep what they had; the rest come from the cart.
  const items = (existing?.items ?? []).filter((i) => locked.includes(i.meal)).map((i) => i.toObject())
  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    const meal = raw.meal
    if (locked.includes(meal) || ![...MEALS, 'special'].includes(meal)) continue
    // Group meals: only real members, each once.
    const ticked =
      acc.kind === 'group' && meal !== 'special' && Array.isArray(raw.members)
        ? acc.group.members.filter((m) => raw.members.some((id) => String(id) === String(m)))
        : null
    const qty = ticked ? ticked.length : Math.min(maxOf(meal), Math.floor(Number(raw.qty) || 0))
    if (qty < 1) continue
    let dish = null
    if (raw.dish) {
      dish = dishes.find((d) => d._id.equals(raw.dish) && d.meal === meal)
      if (!dish) continue // not on that day's menu
    } else if (meal === 'special') continue // specials must be a real dish
    if (meal !== 'special' && items.some((i) => i.meal === meal)) {
      throw fail(400, `Pick just one ${meal} option${acc.kind === 'group' ? ' for the whole group' : ''}.`)
    }
    const same = items.find((i) => i.meal === meal && String(i.dish) === String(dish?._id ?? null))
    if (same) same.qty = Math.min(maxOf(meal), same.qty + qty)
    else items.push({ ...itemFor(meal, dish, qty, settings.prices), ...(ticked ? { members: ticked } : {}) })
  }

  const order = await Order.findOneAndUpdate(
    { account: acc.id, date },
    { kind: acc.kind, items, custom: true, amount: itemsAmount(items) },
    { upsert: true, new: true },
  )
  return { order, locked }
}

// After the admin changes the menu for a day (today or later), bring that day's orders in line:
// plain "Lunch tiffin" lines get the default lunch option, lines for a removed dish move to another
// option of the same kind (veg / non-veg, or back to plain), specials that were removed drop out,
// and prices are refreshed.
// Meals past their cut-off are left alone (their dishes may already be deleted).
export async function syncMenuDay(date) {
  if (date < today()) return // past bills never change
  const [allDishes, { prices, cutoffs }, orders] = await Promise.all([
    Dish.find({ date }).sort({ createdAt: 1 }),
    getSettings(),
    Order.find({ date }),
  ])
  const dishes = servedDishes(allDishes, date)
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
      if (!dish) dish = defaultDish(dishes, item.meal, item.food) // same kind, or none
      const next = { ...itemFor(item.meal, dish ?? null, item.qty, prices, item.food), members: item.members }
      const same = items.find((i) => i.meal === next.meal && String(i.dish) === String(next.dish))
      if (same) {
        same.qty += next.qty
        same.members = [...(same.members ?? []), ...(next.members ?? [])]
      } else items.push(next)
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

// A member who leaves a group is unticked from the group's orders after today.
export async function dropMemberFromGroupOrders(groupId, userId) {
  for (const order of await Order.find({ account: groupId, date: { $gt: today() }, 'items.members': userId })) {
    order.items = order.items
      .map((i) => {
        if (!i.members?.some((m) => m.equals(userId))) return i.toObject()
        const members = i.members.filter((m) => !m.equals(userId))
        return { ...i.toObject(), members, qty: members.length }
      })
      .filter((i) => i.qty > 0)
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
    const isOwner = group.owner.equals(user._id)
    groupSummary = {
      name: group.name,
      people: group.members.length,
      isOwner,
      // The group's bill with the mess is only shown to the owner (they pay it).
      ...(isOwner ? summarize(orders, payments) : {}),
      // What this member ate in the group and still owes the owner.
      myShare: await memberSummary(group, user._id, orders),
    }
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

// Tiffins and ₹ per day, for heatmaps:
// [{ date, tiffins, specials, amount, meals: { breakfast, lunch, dinner }, nonVeg }]
export function perDay(orders) {
  const days = new Map()
  for (const o of orders) {
    const day = days.get(o.date) ?? {
      date: o.date,
      tiffins: 0,
      specials: 0,
      amount: 0,
      meals: { breakfast: 0, lunch: 0, dinner: 0 },
      nonVeg: 0,
    }
    const c = countOf(o)
    day.tiffins += c.tiffins
    day.specials += c.specials
    day.amount += o.amount
    for (const i of o.items) {
      if (i.meal !== 'special') day.meals[i.meal] += i.qty
      if (i.food === 'non-veg') day.nonVeg += i.qty
    }
    days.set(o.date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/* ------------------------------------------------- Members inside a group */

const plainItem = (i) => (i.toObject ? i.toObject() : i)

// Splits one group order by who ate: each ticked member owes their tiffin's price, and the day's specials
// are shared equally by the members who ate that day. Lines without ticks (older orders) stay unassigned.
// Returns { parts: Map(memberId -> { tiffins, amount, items }), unassigned: rupees }.
export function splitOrder(order) {
  const parts = new Map()
  const partOf = (id) => {
    if (!parts.has(id)) parts.set(id, { tiffins: 0, amount: 0, items: [] })
    return parts.get(id)
  }
  let unassigned = 0
  let extras = 0
  for (const i of order.items) {
    if (i.meal === 'special') extras += i.price * i.qty
    else if (!i.members?.length) unassigned += i.price * i.qty
    else {
      const each = (i.price * i.qty) / i.members.length
      for (const m of i.members) {
        const part = partOf(String(m))
        part.tiffins += 1
        part.amount += each
        part.items.push({ ...plainItem(i), qty: 1, price: each, members: undefined })
      }
    }
  }
  if (extras && parts.size) for (const part of parts.values()) part.amount += extras / parts.size
  else unassigned += extras
  return { parts, unassigned }
}

// One member's part of a group order, shaped like an order (for their own calendar).
// Older orders without ticks are shown whole.
export function memberDay(order, memberId) {
  const { parts } = splitOrder(order)
  if (!parts.size) return order
  const part = parts.get(String(memberId))
  return { date: order.date, items: part?.items ?? [], amount: part?.amount ?? 0 }
}

// What one member ate in their group (all days up to today) and what they paid the owner.
async function memberSummary(group, memberId, orders) {
  const paid = await MemberPayment.find({ group: group._id, member: memberId })
  const days = new Set()
  let tiffins = 0
  let charges = 0
  for (const o of orders) {
    const part = splitOrder(o).parts.get(String(memberId))
    if (!part) continue
    if (part.tiffins) days.add(o.date)
    tiffins += part.tiffins
    charges += part.amount
  }
  const total = paid.reduce((sum, p) => sum + p.amount, 0)
  return {
    daysTaken: days.size,
    tiffins,
    charges: Math.round(charges),
    paid: total,
    pending: Math.round(charges - total),
  }
}

// The owner's book for a month ('YYYY-MM'): per member, days and tiffins eaten, their share of the bill,
// what they paid the owner that month, and what they still owe overall (all months).
// Former members who ate or paid are listed too.
export async function groupLedger(group, month) {
  const from = `${month}-01`
  const to = `${month}-31` // compared as text, so this covers every day of the month
  const [orders, payments] = await Promise.all([
    Order.find({ account: group._id, date: { $lte: today() } }),
    MemberPayment.find({ group: group._id }).sort({ paidOn: -1, createdAt: -1 }),
  ])
  const rows = new Map()
  const rowOf = (id) => {
    if (!rows.has(id)) rows.set(id, { days: new Set(), tiffins: 0, share: 0, paid: 0, shareAll: 0, paidAll: 0 })
    return rows.get(id)
  }
  for (const id of group.members) rowOf(String(id))
  let unassigned = 0
  for (const o of orders) {
    const inMonth = o.date >= from && o.date <= to
    const split = splitOrder(o)
    if (inMonth) unassigned += split.unassigned
    for (const [id, part] of split.parts) {
      const row = rowOf(id)
      row.shareAll += part.amount
      if (!inMonth) continue
      if (part.tiffins) row.days.add(o.date)
      row.tiffins += part.tiffins
      row.share += part.amount
    }
  }
  for (const p of payments) {
    const row = rowOf(String(p.member))
    row.paidAll += p.amount
    if (p.paidOn >= from && p.paidOn <= to) row.paid += p.amount
  }
  const users = await User.find({ _id: { $in: [...rows.keys()] } }, 'name')
  const members = [...rows.entries()]
    .map(([id, r]) => ({
      _id: id,
      name: users.find((u) => String(u._id) === id)?.name ?? 'Deleted user',
      current: group.members.some((m) => String(m) === id),
      owner: String(group.owner) === id,
      days: r.days.size,
      tiffins: r.tiffins,
      share: Math.round(r.share),
      paid: r.paid,
      due: Math.round(r.shareAll - r.paidAll),
    }))
    .filter((m) => m.current || m.tiffins || m.paid || m.due)
    .sort((a, b) => b.current - a.current || a.name.localeCompare(b.name))
  const entries = payments.filter((p) => p.paidOn >= from && p.paidOn <= to)
  return { month, members, entries, unassigned: Math.round(unassigned) }
}

/* ------------------------------------------------------- Monthly sheet */

// The admin's register for a month ('YYYY-MM'): one row per customer with what they ate each day
// ({ breakfast, lunch, dinner, specials, amount }) and their month's totals and bill. It fills in day by day.
// Group members get the meals they were ticked for (and their share of the day's specials); a group's
// older orders without ticks get a row of their own.
// With `group`, only that group's order and members (the sheet a group's members see).
export async function monthSheet(month, group = null) {
  await catchUp()
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const dates = Array.from({ length: lastDay }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
  const until = today() // only days that have happened
  const range = { $gte: dates[0], $lte: until < dates.at(-1) ? until : dates.at(-1) }
  const [orders, users, groups, guestOrders] = await Promise.all([
    Order.find({ date: range, ...(group ? { account: group._id } : {}) }),
    User.find({ role: 'user' }).sort({ name: 1 }),
    group ? [group] : Group.find(),
    // Non-membership (WhatsApp) orders, admin sheet only: those the admin marked paid.
    group ? [] : GuestOrder.find({ date: range, status: 'paid' }).sort({ date: 1, createdAt: 1 }),
  ])
  const groupOf = (id) => groups.find((g) => g.members.some((m) => String(m) === id))

  const rows = new Map()
  const rowOf = (id, name, extra = {}) => {
    if (!rows.has(id)) rows.set(id, { _id: id, name, days: {}, ...extra })
    return rows.get(id)
  }
  const cellOf = (row, date) =>
    (row.days[date] ??= { breakfast: 0, lunch: 0, dinner: 0, specials: 0, amount: 0 })
  const addItem = (row, date, i, qty = i.qty) => {
    const cell = cellOf(row, date)
    if (i.meal === 'special') cell.specials += qty
    else cell[i.meal] += qty
  }

  for (const u of users) {
    if (!u.active || (group && !group.members.some((m) => m.equals(u._id)))) continue
    const id = String(u._id)
    rowOf(id, u.name, { phone: u.phone, group: groupOf(id)?.name ?? null })
  }
  const userRow = (id) => {
    const u = users.find((x) => String(x._id) === id)
    return rowOf(id, u?.name ?? 'Deleted user', { phone: u?.phone ?? '', group: groupOf(id)?.name ?? null })
  }

  for (const o of orders) {
    if (o.kind === 'user') {
      const row = userRow(String(o.account))
      for (const i of o.items) addItem(row, o.date, i)
      cellOf(row, o.date).amount += o.amount
      continue
    }
    const group = groups.find((g) => g._id.equals(o.account))
    const { parts } = splitOrder(o)
    for (const [id, part] of parts) {
      const row = userRow(id)
      for (const i of part.items) addItem(row, o.date, i, 1)
      cellOf(row, o.date).amount += part.amount
    }
    // Lines nobody was ticked for (older orders), and the specials when nobody was ticked.
    const loose = o.items.filter((i) => (i.meal === 'special' ? !parts.size : !i.members?.length))
    if (loose.length) {
      const row = rowOf(`group:${o.account}`, `${group?.name ?? 'Deleted group'} (not ticked)`, {
        group: group?.name ?? null,
        unticked: true,
      })
      for (const i of loose) addItem(row, o.date, i)
      cellOf(row, o.date).amount += itemsAmount(loose)
    }
  }

  const list = [...rows.values()].map((row) => {
    const t = { breakfast: 0, lunch: 0, dinner: 0, specials: 0, amount: 0, days: 0 }
    for (const cell of Object.values(row.days)) {
      for (const k of ['breakfast', 'lunch', 'dinner', 'specials', 'amount']) t[k] += cell[k]
      if (cell.breakfast + cell.lunch + cell.dinner > 0) t.days += 1
    }
    for (const cell of Object.values(row.days)) cell.amount = Math.round(cell.amount)
    return { ...row, totals: { ...t, tiffins: t.breakfast + t.lunch + t.dinner, amount: Math.round(t.amount) } }
  })
  list.sort((a, b) => (a.group ?? '~').localeCompare(b.group ?? '~') || a.name.localeCompare(b.name))
  const guests = guestOrders.map((g) => ({
    _id: g._id,
    code: g.code,
    date: g.date,
    name: g.name,
    phone: g.phone,
    items: g.items.map(({ meal, name, qty }) => ({ meal, name, qty })),
    tiffins: g.items.filter((i) => i.meal !== 'special').reduce((s, i) => s + i.qty, 0),
    amount: g.amount,
    delivery: g.delivery,
    paidAt: g.paidAt,
  }))
  return { month, dates, until, rows: list, guests }
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
    await MemberPayment.deleteMany({ group: group._id }) // money between members only made sense in the group
  } else {
    await Order.deleteMany({ account: group._id })
    await MemberPayment.deleteMany({ group: group._id })
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

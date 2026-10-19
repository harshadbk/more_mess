import { Router } from 'express'
import Group from '../models/Group.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import { today } from '../tiffins.js'
import { loggedIn } from '../auth.js'

const router = Router()
router.use(loggedIn)

const isAdmin = (user) => user.role === 'admin'
const myGroup = (user) => Group.findOne({ members: user._id })
// In a group only the owner pays the mess, so only they see and handle the group's payments.
const myOwnGroup = (user) => Group.findOne({ owner: user._id })

// Is this user on the customer side of the payment (the person, or a member of the group)?
async function isPayer(user, payment) {
  if (payment.user?.equals(user._id)) return true
  const group = payment.group && (await myOwnGroup(user))
  return Boolean(group && group._id.equals(payment.group))
}

// Admin sees every payment; a customer sees their own, and a group's owner the group's too.
router.get('/', async (req, res) => {
  let filter = {}
  if (!isAdmin(req.user)) {
    const group = await myOwnGroup(req.user)
    filter = { $or: [{ user: req.user._id }, ...(group ? [{ group: group._id }] : [])] }
  }
  res.json({ payments: await Payment.find(filter).sort({ paidOn: -1, createdAt: -1 }) })
})

// Record a payment.
// Admin: { amount, userId or groupId, paidOn?, note? }
// Customer: { amount, forGroup?: true, paidOn?, note? } (for themselves, or the group's owner for their group)
router.post('/', async (req, res) => {
  const { amount, paidOn, note, userId, groupId, forGroup } = req.body
  if (!(Number(amount) > 0)) return res.status(400).json({ error: 'Enter the amount paid.' })

  let payer
  if (isAdmin(req.user)) {
    payer = groupId ? { group: await Group.findById(groupId) } : { user: await User.findById(userId) }
  } else {
    payer = forGroup ? { group: await myOwnGroup(req.user) } : { user: req.user }
  }
  const who = payer.group ?? payer.user
  if (!who) {
    const error = forGroup ? "Only the group's owner pays the mess for the group." : 'Choose who paid.'
    return res.status(400).json({ error })
  }

  const payment = await Payment.create({
    user: payer.user?._id,
    group: payer.group?._id,
    payerName: who.name,
    amount: Number(amount),
    paidOn: paidOn || today(),
    note,
    addedBy: isAdmin(req.user) ? 'admin' : 'customer',
    adminConfirmed: isAdmin(req.user), // whoever adds it agrees to it
    customerConfirmed: !isAdmin(req.user),
  })
  res.status(201).json({ payment })
})

// The other side agrees ("yes, this was paid") or rejects it.
async function decide(req, res, agree) {
  const payment = await Payment.findById(req.params.id)
  if (!payment) return res.status(404).json({ error: 'Payment not found.' })

  const side = isAdmin(req.user) ? 'admin' : (await isPayer(req.user, payment)) ? 'customer' : null
  if (!side) return res.status(403).json({ error: 'This payment is not yours.' })
  if (payment.rejected || (payment.adminConfirmed && payment.customerConfirmed)) {
    return res.status(400).json({ error: 'This payment is already settled.' })
  }

  if (agree) payment[`${side}Confirmed`] = true
  else payment.rejected = true
  await payment.save()
  res.json({ payment })
}

router.post('/:id/confirm', (req, res) => decide(req, res, true))
router.post('/:id/reject', (req, res) => decide(req, res, false))

export default router

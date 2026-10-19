import { Router } from 'express'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { loggedIn } from '../auth.js'
import { cleanPhone } from './auth.js'
import MemberPayment from '../models/MemberPayment.js'
import { dropMemberFromGroupOrders, dropOwnFutureOrders, groupLedger, isDate, removeGroup, today } from '../tiffins.js'

const router = Router()
router.use(loggedIn) // every group route needs a logged-in user

// Fetch a group with member details filled in.
const findGroup = (id) => Group.findById(id).populate('owner members', 'name email phone foodPreference')

const isOwnerOrAdmin = (group, user) => group.owner.equals(user._id) || user.role === 'admin'

// Groups are optional, but a person can be in only one group at a time
// (so their tiffins and payments are counted in one place).
const inAGroup = (userId) => Group.exists({ members: userId })

// My groups
router.get('/', async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).populate(
    'owner members',
    'name email phone foodPreference',
  )
  res.json({ groups })
})

// Create a group (you become the owner and first member)
router.post('/', async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Group name is required.' })
  if (await inAGroup(req.user._id))
    return res.status(400).json({ error: 'You are already in a group. Leave it first.' })

  const group = await Group.create({ name, description, owner: req.user._id, members: [req.user._id] })
  await dropOwnFutureOrders(req.user._id) // from tomorrow the group's order covers them
  res.status(201).json({ group: await findGroup(group._id) })
})

// Join a group with its invite code
router.post('/join', async (req, res) => {
  const group = await Group.findOne({ inviteCode: req.body.inviteCode?.trim().toUpperCase() })
  if (!group) return res.status(404).json({ error: 'No group found with that invite code.' })
  if (group.members.includes(req.user._id)) return res.status(400).json({ error: 'You are already in this group.' })
  if (await inAGroup(req.user._id))
    return res.status(400).json({ error: 'You are already in a group. Leave it first.' })

  group.members.push(req.user._id)
  await group.save()
  await dropOwnFutureOrders(req.user._id) // from tomorrow the group's order covers them
  res.json({ group: await findGroup(group._id) })
})

// Owner adds a member by email or phone
router.post('/:id/members', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })
  if (!isOwnerOrAdmin(group, req.user)) return res.status(403).json({ error: 'Only the owner can add members.' })

  const identifier = req.body.identifier?.trim().toLowerCase() || ''
  const user = await User.findOne({ $or: [{ email: identifier }, { phone: cleanPhone(identifier) }] })
  if (!user) return res.status(404).json({ error: 'No user with that email or phone.' })
  if (group.members.includes(user._id)) return res.status(400).json({ error: `${user.name} is already in this group.` })
  if (await inAGroup(user._id)) return res.status(400).json({ error: `${user.name} is already in another group.` })

  group.members.push(user._id)
  await group.save()
  await dropOwnFutureOrders(user._id)
  res.json({ group: await findGroup(group._id) })
})

// Owner removes a member, or a member leaves (removes themselves)
router.delete('/:id/members/:userId', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })

  const leaving = req.user._id.equals(req.params.userId)
  if (!leaving && !isOwnerOrAdmin(group, req.user)) {
    return res.status(403).json({ error: 'Only the owner can remove members.' })
  }
  if (group.owner.equals(req.params.userId)) {
    return res.status(400).json({ error: 'The owner cannot leave. Delete the group instead.' })
  }

  group.members.pull(req.params.userId)
  await group.save()
  await dropMemberFromGroupOrders(group._id, req.params.userId) // they are not on the group's later orders
  res.json(leaving ? { left: true } : { group: await findGroup(group._id) })
})

/* -------------------------------------------- Money between members and the owner */

// The month's book: what each member ate, their share, what they paid the owner, what they still owe.
// The owner (and admin) sees everyone; a member sees only their own row and payments.
router.get('/:id/ledger', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })
  const isMember = group.members.some((m) => m.equals(req.user._id))
  if (!isMember && !isOwnerOrAdmin(group, req.user)) return res.status(403).json({ error: 'Not your group.' })

  const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : today().slice(0, 7)
  const ledger = await groupLedger(group, month)
  if (isOwnerOrAdmin(group, req.user)) return res.json({ ...ledger, canEdit: true })
  const me = String(req.user._id)
  res.json({
    month,
    canEdit: false,
    members: ledger.members.filter((m) => m._id === me),
    entries: ledger.entries.filter((p) => String(p.member) === me),
  })
})

// Owner records that a member paid them: { member, amount, paidOn?, note? }
router.post('/:id/ledger', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })
  if (!isOwnerOrAdmin(group, req.user)) return res.status(403).json({ error: 'Only the owner can record this.' })
  const { member, amount, paidOn, note } = req.body
  if (!group.members.some((m) => String(m) === String(member))) {
    return res.status(400).json({ error: 'Pick a member of the group.' })
  }
  if (!(Number(amount) > 0)) return res.status(400).json({ error: 'Enter the amount paid.' })
  if (paidOn && (!isDate(paidOn) || paidOn > today())) return res.status(400).json({ error: 'Pick a day up to today.' })
  const entry = await MemberPayment.create({
    group: group._id,
    member,
    amount: Number(amount),
    paidOn: paidOn || today(),
    note,
  })
  res.status(201).json({ entry })
})

// Owner removes a wrong entry.
router.delete('/:id/ledger/:entryId', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })
  if (!isOwnerOrAdmin(group, req.user)) return res.status(403).json({ error: 'Only the owner can remove this.' })
  await MemberPayment.deleteOne({ _id: req.params.entryId, group: group._id })
  res.json({ deleted: true })
})

// Owner deletes the group
router.delete('/:id', async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return res.status(404).json({ error: 'Group not found.' })
  if (!isOwnerOrAdmin(group, req.user)) return res.status(403).json({ error: 'Only the owner can delete the group.' })

  await removeGroup(group) // its payments move to the owner, so no money is lost
  res.json({ deleted: true })
})

export default router

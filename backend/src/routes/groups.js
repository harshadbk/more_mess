import { Router } from 'express'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { loggedIn } from '../auth.js'
import { cleanPhone } from './auth.js'
import { dropOwnFutureOrders, removeGroup } from '../tiffins.js'

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
  res.json(leaving ? { left: true } : { group: await findGroup(group._id) })
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

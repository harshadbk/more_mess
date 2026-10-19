import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { envAdmin, isAdminLogin, loggedIn, makeToken } from '../auth.js'
import { addDays, today } from '../tiffins.js'

const router = Router()

// Keep only the digits and drop a leading +91 / 0, so "+91 98765-43210" becomes "9876543210".
export const cleanPhone = (phone = '') => String(phone).replace(/\D/g, '').slice(-10)

// Sign up. Always creates a normal user, never an admin.
router.post('/register', async (req, res) => {
  const { name, email, phone, password, plan, meals, foodPreference, occupation, address } = req.body

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone and password are required.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }
  // The admin's email and phone are reserved (the admin logs in from .env, not as a customer).
  const admin = envAdmin()
  if (admin && (email.trim().toLowerCase() === admin.email || (admin.phone && cleanPhone(phone) === admin.phone))) {
    return res.status(400).json({ error: 'That email or phone is already used.' })
  }

  const user = await User.create({
    name,
    email,
    phone: cleanPhone(phone),
    password: await bcrypt.hash(password, 10),
    plan,
    meals,
    startDate: addDays(today(), 1), // daily tiffins start tomorrow (they can still add today's)
    foodPreference,
    occupation,
    address,
  })
  res.status(201).json({ token: makeToken(user), user })
})

// Log in with email or phone number.
router.post('/login', async (req, res) => {
  const { identifier = '', password = '' } = req.body
  // The admin is checked against .env first; nothing about the admin is stored in the database.
  if (isAdminLogin(identifier, password)) {
    const admin = envAdmin()
    return res.json({ token: makeToken(admin), user: admin })
  }
  const user = await User.findOne({
    $or: [{ email: identifier.trim().toLowerCase() }, { phone: cleanPhone(identifier) }],
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Wrong email/phone or password.' })
  }
  res.json({ token: makeToken(user), user })
})

// Who is logged in?
router.get('/me', loggedIn, (req, res) => res.json({ user: req.user }))

// Change my plan or details.
router.patch('/me', loggedIn, async (req, res) => {
  if (req.user.role === 'admin') return res.status(400).json({ error: "The admin's details are set in .env." })
  for (const field of ['name', 'plan', 'meals', 'foodPreference', 'occupation', 'address']) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field]
  }
  await req.user.save() // a new plan applies from tomorrow; today's order can be changed in the cart
  res.json({ user: req.user })
})

export default router

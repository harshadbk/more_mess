import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from './models/User.js'

// Runs when the server starts: makes sure the admin from .env exists
// (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE). Changing ADMIN_PASSWORD
// in .env and restarting the server changes the admin's password.
export async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env
  if (!ADMIN_EMAIL) return console.log('No ADMIN_EMAIL in .env, so no admin account was set up.')

  const email = ADMIN_EMAIL.trim().toLowerCase()
  const admin = await User.findOne({ email })

  if (!ADMIN_PASSWORD) {
    if (admin) return console.log(`Admin: ${email}`)
    return console.log(`Admin ${email} not created yet: add ADMIN_PASSWORD to .env and restart.`)
  }

  try {
    if (!admin) {
      await User.create({
        email,
        name: ADMIN_NAME || 'Admin',
        phone: (ADMIN_PHONE || '').replace(/\D/g, '').slice(-10) || '0000000000',
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: 'admin',
      })
      return console.log(`Admin created: ${email}`)
    }
    if (admin.role !== 'admin' || !(await bcrypt.compare(ADMIN_PASSWORD, admin.password))) {
      admin.role = 'admin'
      admin.password = await bcrypt.hash(ADMIN_PASSWORD, 10)
      await admin.save()
      return console.log(`Admin updated from .env: ${email}`)
    }
    console.log(`Admin: ${email}`)
  } catch (err) {
    // e.g. ADMIN_PHONE already belongs to another account. Don't stop the server for this.
    console.log(
      `Could not set up admin ${email}: ${err.code === 11000 ? 'ADMIN_PHONE is already used by another account' : err.message}`,
    )
  }
}

// Creates the login token the browser keeps (valid for 7 days).
export const makeToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// Checks the "Authorization: Bearer <token>" header and puts the user on req.user.
export async function loggedIn(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(id)
    if (!req.user) throw new Error('user deleted')
    next()
  } catch {
    res.status(401).json({ error: 'Please log in again.' })
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' })
  next()
}

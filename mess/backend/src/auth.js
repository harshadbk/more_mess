import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from './models/User.js'

// The admin lives only in .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE), never in the
// database. Changing ADMIN_PASSWORD in .env and restarting the server changes the admin's password.
const ADMIN_ID = new mongoose.Types.ObjectId('000000000000000000000000') // fixed id, never a real user

// The admin from .env, shaped like a user, or null when .env has no admin.
export function envAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env
  if (!ADMIN_EMAIL?.trim() || !ADMIN_PASSWORD) return null
  return {
    _id: ADMIN_ID,
    name: ADMIN_NAME || 'Admin',
    email: ADMIN_EMAIL.trim().toLowerCase(),
    phone: (ADMIN_PHONE || '').replace(/\D/g, '').slice(-10),
    role: 'admin',
  }
}

// Does this login (email or phone + password) belong to the .env admin?
export function isAdminLogin(identifier, password) {
  const admin = envAdmin()
  if (!admin) return false
  const id = String(identifier).trim().toLowerCase()
  const phone = id.replace(/\D/g, '').slice(-10)
  if (id !== admin.email && !(admin.phone && phone === admin.phone)) return false
  // Compare hashes so the check takes the same time however much of the password matches.
  const hash = (text) => crypto.createHash('sha256').update(String(text)).digest()
  return crypto.timingSafeEqual(hash(password), hash(process.env.ADMIN_PASSWORD))
}

// Runs when the server starts: only says whether an admin is set up in .env (nothing is saved).
export function checkAdmin() {
  const admin = envAdmin()
  if (admin) console.log(`Admin (from .env): ${admin.email}`)
  else console.log('No ADMIN_EMAIL / ADMIN_PASSWORD in .env, so nobody can log in as admin.')
}

// Creates the login token the browser keeps (valid for 7 days).
// The admin's token carries their .env email instead of a database id.
export const makeToken = (user) =>
  jwt.sign(user.role === 'admin' && user._id.equals(ADMIN_ID) ? { admin: user.email } : { id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

// Checks the "Authorization: Bearer <token>" header and puts the user on req.user.
export async function loggedIn(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const { id, admin } = jwt.verify(token, process.env.JWT_SECRET)
    if (admin) {
      // Stops working if ADMIN_EMAIL changes or is removed from .env.
      req.user = envAdmin()?.email === admin ? envAdmin() : null
    } else {
      req.user = await User.findById(id)
    }
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

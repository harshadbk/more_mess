import express from 'express'
import cors from 'cors'
import { connectDB } from './db.js'
import { checkAdmin } from './auth.js'
import authRoutes from './routes/auth.js'
import groupRoutes from './routes/groups.js'
import adminRoutes from './routes/admin.js'
import orderRoutes from './routes/orders.js'
import paymentRoutes from './routes/payments.js'
import menuRoutes from './routes/menu.js'
import { catchUp, dropExpiredDishes, fixOldData, syncUpcomingMenus } from './tiffins.js'

const app = express()
// Website address(es) allowed to call the API, comma-separated in .env
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()) }))
app.use(express.json({ limit: '1mb' })) // dish photos are sent as text
app.use((req, _res, next) => {
  req.body ??= {} // so routes can always read req.body safely
  next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/menu', menuRoutes)

// Any error thrown in a route ends up here.
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message })
  if (err.code === 11000) return res.status(400).json({ error: 'This email or phone is already registered.' })
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message })
  if (err.name === 'CastError') return res.status(404).json({ error: 'Not found.' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong.' })
})

const port = process.env.PORT || 5000
await connectDB()
checkAdmin() // the admin comes from .env only; nothing is saved in the database
await fixOldData()
await catchUp() // create today's tiffin records
await syncUpcomingMenus() // match today's and later orders to the posted menu
await dropExpiredDishes() // a meal's dishes go once its cut-off time has passed
setInterval(() => catchUp().catch(console.error), 60 * 60 * 1000) // and keep doing it every hour
setInterval(() => dropExpiredDishes().catch(console.error), 60 * 1000) // checked every minute
app.listen(port, () => console.log(`API running on http://localhost:${port}`))

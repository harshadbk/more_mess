import dns from 'node:dns'
import mongoose from 'mongoose'

// Some Windows setups leave Node with an unusable DNS server (127.0.0.1), which breaks the
// SRV lookup that mongodb+srv:// URIs need. DNS_SERVERS=8.8.8.8,1.1.1.1 works around it.
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()))

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

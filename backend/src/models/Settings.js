import mongoose from 'mongoose'

// One document with mess-wide settings.
const settingsSchema = new mongoose.Schema({
  // Price of one tiffin for each meal, in ₹. Set by the admin.
  prices: {
    breakfast: { type: Number, default: 0, min: 0 },
    lunch: { type: Number, default: 0, min: 0 },
    dinner: { type: Number, default: 0, min: 0 },
  },
  filledUpTo: { type: String, default: '' }, // last day the daily tiffin records were created for
})

export default mongoose.model('Settings', settingsSchema)

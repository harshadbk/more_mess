import mongoose from 'mongoose'

// One document with mess-wide settings.
const settingsSchema = new mongoose.Schema({
  // Standard price of one tiffin for each meal, in ₹. A dish can have its own price instead.
  prices: {
    breakfast: { type: Number, default: 0, min: 0 },
    lunch: { type: Number, default: 0, min: 0 },
    dinner: { type: Number, default: 0, min: 0 },
  },
  // Last time ('HH:MM', India time) to change today's order for each meal, so the kitchen knows
  // what to cook. Specials follow the dinner time.
  cutoffs: {
    breakfast: { type: String, default: '07:00' },
    lunch: { type: String, default: '11:00' },
    dinner: { type: String, default: '18:00' },
  },
  filledUpTo: { type: String, default: '' }, // last day the daily orders were created for
})

export default mongoose.model('Settings', settingsSchema)

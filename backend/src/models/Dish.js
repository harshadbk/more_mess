import mongoose from 'mongoose'

// A dish on the menu for one day and one meal, added by the admin.
const dishSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    meal: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'special'], required: true },
    name: { type: String, required: true, trim: true },
    food: { type: String, enum: ['veg', 'non-veg'], default: 'veg' },
    price: { type: Number, default: 0, min: 0 }, // needed for specials (they cost extra)
    description: { type: String, trim: true, default: '' },
    image: { type: String, default: '' }, // small photo stored as a data URL
  },
  { timestamps: true },
)

dishSchema.index({ date: 1, meal: 1 })

export default mongoose.model('Dish', dishSchema)

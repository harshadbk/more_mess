import mongoose from 'mongoose'

// One day's order (the "cart") for one account: a person eating alone, or a whole group.
// Each day it starts from the plan(s); the person, or the group's owner, can change it.
const itemSchema = new mongoose.Schema(
  {
    meal: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'special'], required: true },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', default: null }, // null = standard tiffin
    name: { type: String, required: true }, // copied, so the bill never changes later
    food: { type: String, enum: ['veg', 'non-veg'], default: 'veg' }, // copied too, used to pick a replacement
    price: { type: Number, required: true, min: 0 }, // ₹ for one
    base: { type: Boolean, default: false }, // true = uses the meal's standard price (follows price changes)
    qty: { type: Number, required: true, min: 1 },
    // Group orders only: the members ticked as eating this meal (qty = how many). Empty on older orders.
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, required: true }, // the user's id or the group's id
  kind: { type: String, enum: ['user', 'group'], required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  items: [itemSchema],
  custom: { type: Boolean, default: false }, // true = changed by hand (not just the plan)
  amount: { type: Number, default: 0 }, // ₹ total for the day
})

orderSchema.index({ account: 1, date: 1 }, { unique: true })
orderSchema.index({ date: 1 })

export default mongoose.model('Order', orderSchema)

import mongoose from 'mongoose'

// One customer's tiffins for one day. This is the mess's daily record:
// it is filled in from the customer's plan each day (see tiffins.js), and the
// customer can change it (skip a meal, add a special) for today or a later day.
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
  // Extra special dishes, copied from the menu so the bill never changes later.
  specials: [
    {
      dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      name: String,
      price: Number,
      qty: Number,
    },
  ],
  custom: { type: Boolean, default: false }, // true = the customer changed this day themselves
  amount: { type: Number, default: 0 }, // ₹ for this day, worked out when saved
})

orderSchema.index({ user: 1, date: 1 }, { unique: true })
orderSchema.index({ date: 1 })

export default mongoose.model('Order', orderSchema)

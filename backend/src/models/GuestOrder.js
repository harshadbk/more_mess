import mongoose from 'mongoose'
import { itemSchema } from './Order.js'

// A "today only" order from the home page, by someone without an account (a non-membership order).
// Saved when they prepare the WhatsApp message: new -> confirmed (after replying on WhatsApp) -> paid
// (the admin checked the money came in). The kitchen cooks every order that isn't cancelled, but only
// paid ones count as revenue (monthly sheet, heatmap, dues).
const guestOrderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // short reference, e.g. "G4K7Q", also in the message
    token: { type: String, required: true, select: false }, // lets the same browser fix the order before sending
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    name: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true }, // '91XXXXXXXXXX'
    items: [itemSchema],
    amount: { type: Number, default: 0, min: 0 }, // ₹: estimate from today's prices, the final price once paid
    delivery: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    address: { type: String, trim: true, default: '', maxlength: 200 },
    note: { type: String, trim: true, default: '', maxlength: 300 },
    status: { type: String, enum: ['new', 'confirmed', 'paid', 'cancelled'], default: 'new' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
)

guestOrderSchema.index({ date: 1 })
guestOrderSchema.index({ phone: 1, date: 1 })

export default mongoose.model('GuestOrder', guestOrderSchema)

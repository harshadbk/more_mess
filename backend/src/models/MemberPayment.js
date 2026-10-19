import mongoose from 'mongoose'

// Money a member gave their group's owner (the owner pays the mess for everyone).
// Only the owner records these; each member can see their own.
const memberPaymentSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    paidOn: { type: String, required: true }, // 'YYYY-MM-DD'
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

memberPaymentSchema.index({ group: 1, member: 1, paidOn: 1 })

export default mongoose.model('MemberPayment', memberPaymentSchema)

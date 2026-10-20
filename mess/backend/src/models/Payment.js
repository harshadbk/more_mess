import mongoose from 'mongoose'

// Money paid to the mess by one person or by a group.
// It counts only when BOTH sides agree: whoever adds it confirms automatically,
// and the other side (admin or customer) confirms or rejects it.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set for an individual
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // set for a group
    payerName: { type: String, required: true }, // kept even if the user/group is deleted later
    amount: { type: Number, required: true, min: 1 },
    paidOn: { type: String, required: true }, // 'YYYY-MM-DD'
    note: { type: String, trim: true, default: '' },
    addedBy: { type: String, enum: ['admin', 'customer'], required: true },
    adminConfirmed: { type: Boolean, default: false },
    customerConfirmed: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('Payment', paymentSchema)

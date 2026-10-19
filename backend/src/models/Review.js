import mongoose from 'mongoose'

// A rating (1-5 stars) and comment about the mess, shown on the home page. Anyone can rate:
//   - a logged-in customer: one review each (`user`), shown as "Verified customer";
//   - a visitor: one review per mobile number (`phone`, never shown), changed later with `token`
//     (kept in the browser that wrote it).
// The admin can delete any review.
const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, select: false }, // visitors only: '91XXXXXXXXXX'
    token: { type: String, select: false }, // visitors only
    name: { type: String, required: true }, // shown as "Rohan K." (copied, so it stays if the user changes later)
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { timestamps: true },
)

// One review per customer and one per visitor's number (each field is missing on the other kind).
reviewSchema.index({ user: 1 }, { unique: true, sparse: true })
reviewSchema.index({ phone: 1 }, { unique: true, sparse: true })
reviewSchema.index({ createdAt: -1 })

export default mongoose.model('Review', reviewSchema)

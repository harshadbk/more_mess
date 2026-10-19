import mongoose from 'mongoose'

// A customer's rating (1-5 stars) and comment about the mess. One per customer; they can change it.
// Shown on the home page; the admin can delete any review.
const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true }, // shown as "Rohan K." (copied, so it stays if the user changes later)
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { timestamps: true },
)

reviewSchema.index({ createdAt: -1 })

export default mongoose.model('Review', reviewSchema)

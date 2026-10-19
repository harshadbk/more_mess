import mongoose from 'mongoose'

// Random 6-character code like "K7Q2MX" that people type in to join a group.
export const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: { type: String, unique: true, default: makeInviteCode },
  },
  { timestamps: true },
)

export default mongoose.model('Group', groupSchema)

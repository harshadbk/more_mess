import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never the real password
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    // How they pay: every day, every week or every month.
    plan: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
    // Which tiffins they take every day, e.g. ['lunch', 'dinner'].
    meals: {
      type: [{ type: String, enum: ['breakfast', 'lunch', 'dinner'] }],
      default: () => ['lunch', 'dinner'],
    },
    // First day their daily tiffins start ('YYYY-MM-DD'). Set to tomorrow when they sign up.
    startDate: { type: String, default: '' },
    // Admin turns this off when someone leaves the mess (they stop being counted).
    active: { type: Boolean, default: true },

    foodPreference: { type: String, enum: ['veg', 'non-veg', 'jain'], default: 'veg' },
    occupation: { type: String, enum: ['student', 'working', 'other'], default: 'student' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

// Never send the password hash to the browser.
userSchema.set('toJSON', {
  transform: (_doc, user) => {
    delete user.password
    return user
  },
})

export default mongoose.model('User', userSchema)

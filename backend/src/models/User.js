import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number'],
      default: null,
    },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    isEmailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    // Hashes only, mirroring the password field — a stolen DB snapshot
    // should never hand over usable session tokens either.
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          deviceInfo: { type: String, default: null },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      select: false,
      default: [],
    },
    stripeCustomerId: { type: String, select: false, default: null },
  },
  { timestamps: true, versionKey: false },
)

// email already gets a unique index from `unique: true` above; this one
// supports admin queries/listing filtered by role.
userSchema.index({ role: 1 })

// No `next` param: an async function with zero declared arguments is
// treated as promise-returning, which Mongoose 9 awaits natively — mixing
// that with a callback param is what broke the slug hooks (see Tour/Category).
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model('User', userSchema)

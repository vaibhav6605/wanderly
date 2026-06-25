import mongoose from 'mongoose'

const { Schema } = mongoose

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: null },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return this.discountType !== 'percentage' || value <= 100
        },
        message: 'Percentage discounts cannot exceed 100',
      },
    },
    maxDiscountAmount: { type: Number, min: 0, default: null },
    minBookingAmount: { type: Number, min: 0, default: 0 },
    // Empty array = applies to everything; non-empty = allowlist.
    applicableTours: { type: [{ type: Schema.Types.ObjectId, ref: 'Tour' }], default: [] },
    applicableCategories: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    usageLimit: { type: Number, min: 1, default: null },
    usageLimitPerUser: { type: Number, min: 1, default: 1 },
    // Counter, not a `usedBy: [ObjectId]` array — a popular global coupon
    // could be redeemed by tens of thousands of users; per-user usage is
    // enforced by querying Bookings, not by an unbounded array here.
    usedCount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, required: true },
    validUntil: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.validFrom
        },
        message: 'validUntil must be after validFrom',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

couponSchema.index({ validUntil: 1, isActive: 1 })

export const Coupon = mongoose.model('Coupon', couponSchema)

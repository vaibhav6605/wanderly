import mongoose from 'mongoose'
import slugify from 'slugify'

const { Schema } = mongoose

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: { type: String, maxlength: 300, default: null },
    icon: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

// No `next` param: zero declared arguments tells Mongoose 9 this hook is
// synchronous, so it runs to completion without a callback.
categorySchema.pre('validate', function setSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
})

export const Category = mongoose.model('Category', categorySchema)

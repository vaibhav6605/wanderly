import mongoose from 'mongoose'

const { Schema } = mongoose

const destinationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: null },
    description: { type: String, maxlength: 1000, default: null },
    coverImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: (coords) => !coords || coords.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    popularTags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

destinationSchema.index({ location: '2dsphere' })
destinationSchema.index({ name: 'text', country: 'text' })
destinationSchema.index({ country: 1, city: 1 })

export const Destination = mongoose.model('Destination', destinationSchema)

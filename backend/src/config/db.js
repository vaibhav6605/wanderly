import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from './logger.js'

export async function connectDB() {
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`)
  })
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
  })

  await mongoose.connect(env.mongoUri)
  logger.info(`MongoDB connected: ${mongoose.connection.host}`)
}

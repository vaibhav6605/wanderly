import { app } from './app.js'
import { env, assertRequiredEnv } from '#config/env.js'
import { connectDB } from '#config/db.js'
import { logger } from '#config/logger.js'

async function start() {
  assertRequiredEnv()
  await connectDB()
  app.listen(env.port, () => {
    logger.info(`Wanderly API listening on port ${env.port}`)
  })
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`)
  process.exit(1)
})

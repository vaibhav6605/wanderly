import { app } from './app.js'
import { env, assertRequiredEnv } from '#config/env.js'
import { connectDB } from '#config/db.js'

async function start() {
  assertRequiredEnv()
  await connectDB()
  app.listen(env.port, () => {
    console.log(`Wanderly API listening on port ${env.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

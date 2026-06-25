import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod

// Shared by any test that needs real Mongo behavior (aggregations, hooks,
// unique-index enforcement) instead of just schema validation — spins up a
// real, ephemeral mongod per test file rather than mocking the driver.
export async function connectTestDB() {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}

export async function clearTestDB() {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
}

export async function disconnectTestDB() {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
}

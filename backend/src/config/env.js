import 'dotenv/config'

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}

// Called by server.js before connecting to the DB — kept out of app.js so
// importing the Express app in tests never requires a live Mongo URI.
export function assertRequiredEnv() {
  const required = ['MONGO_URI']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
  }
}

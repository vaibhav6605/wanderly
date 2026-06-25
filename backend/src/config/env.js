import 'dotenv/config'

const rawClientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,

  // Comma-separated so staging/prod can allow multiple origins (e.g. the
  // production Vercel domain plus preview-deployment URLs).
  clientOrigins: rawClientOrigin.split(',').map((origin) => origin.trim()),

  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production'
      ? 'info'
      : process.env.NODE_ENV === 'test'
        ? 'error'
        : 'debug'),

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
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

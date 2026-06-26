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

  // Separate, tighter limits for the brute-force/abuse-prone auth endpoints.
  // Configurable (not hardcoded in auth.routes.js) so a test run can raise
  // the ceiling without weakening the real production default.
  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  },
  refreshRateLimit: {
    windowMs: Number(process.env.REFRESH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 30,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    // Short-lived on purpose — a leaked access token is only useful for
    // this long. Anything longer-lived is the refresh token's job, which
    // is revocable; this isn't.
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30,
    get refreshExpiresIn() {
      return `${this.refreshExpiresDays}d`
    },
    get refreshExpiresMs() {
      return this.refreshExpiresDays * 24 * 60 * 60 * 1000
    },
  },

  smtp: {
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.EMAIL_FROM || 'Wanderly <no-reply@wanderly.test>',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? null,
    apiKey: process.env.CLOUDINARY_API_KEY ?? null,
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? null,
    // Signing secret from the Stripe dashboard webhook endpoint — used to
    // verify that webhook events actually came from Stripe, not a spoof.
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
  },
}

// Called by server.js before connecting to the DB — kept out of app.js so
// importing the Express app in tests never requires a live Mongo URI.
export function assertRequiredEnv() {
  const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
  }
}

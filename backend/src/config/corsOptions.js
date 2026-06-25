import { env } from './env.js'
import { ApiError } from '#utils/ApiError.js'

export const corsOptions = {
  origin(origin, callback) {
    // No Origin header means a non-browser caller (curl, server-to-server,
    // the Stripe webhook) — those aren't subject to CORS, so allow them.
    if (!origin || env.clientOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(ApiError.forbidden(`CORS: origin '${origin}' is not allowed`))
  },
  credentials: true,
}

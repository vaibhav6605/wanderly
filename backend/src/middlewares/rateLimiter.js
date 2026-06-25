import rateLimit from 'express-rate-limit'
import { env } from '#config/env.js'
import { ApiError } from '#utils/ApiError.js'

// Factory so stricter, route-specific limiters (e.g. 10 req/15min on
// /auth/login) can reuse the same ApiError-shaped 429 response later.
export function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(ApiError.tooMany(message))
    },
  })
}

export const apiLimiter = createRateLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
})

import mongoose from 'mongoose'
import { logger } from '#config/logger.js'
import { env } from '#config/env.js'
import { ApiError } from '#utils/ApiError.js'

// Collapses every error this app can throw — our own ApiError, Mongoose's
// CastError/ValidationError/duplicate-key, or a raw unexpected exception —
// into one trusted ApiError shape before it ever reaches the response.
function normalizeError(err) {
  if (err instanceof ApiError) return err

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for field '${err.path}': ${err.value}`)
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((fieldError) => ({
      path: fieldError.path,
      message: fieldError.message,
    }))
    return ApiError.badRequest('Validation failed', details)
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    return ApiError.conflict(`Duplicate value for field '${field}'`)
  }

  // Unknown/programmer error: hide the real message in production so we
  // never leak internals, but show it in dev for fast debugging.
  return ApiError.internal(env.isProduction ? undefined : err.message)
}

export function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err)

  // Only 5xx is worth a full stack trace — 4xx is an expected, already
  // logged-by-morgan outcome (bad input, missing resource, etc).
  if (normalized.statusCode >= 500) {
    logger.error(err.stack || err.message)
  }

  res.status(normalized.statusCode).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  })
}

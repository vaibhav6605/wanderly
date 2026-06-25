// `code` is a stable, machine-readable identifier (for client-side branching/
// i18n) — independent of `statusCode`, which is the transport-level HTTP code.
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = 'Bad request', details = null) {
    return new ApiError(400, message, 'BAD_REQUEST', details)
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN')
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND')
  }

  static conflict(message = 'Conflict', details = null) {
    return new ApiError(409, message, 'CONFLICT', details)
  }

  static unprocessable(message = 'Validation failed', details = null) {
    return new ApiError(422, message, 'VALIDATION_ERROR', details)
  }

  static tooMany(message = 'Too many requests, please try again later.') {
    return new ApiError(429, message, 'RATE_LIMITED')
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR')
  }
}

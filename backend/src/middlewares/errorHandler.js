export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const isOperational = err.isOperational ?? false

  if (!isOperational) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details ? { details: err.details } : {}),
    },
  })
}

// Wraps async route handlers so rejected promises reach the centralized
// error handler instead of needing a try/catch in every controller.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

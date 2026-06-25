import { ApiError } from '#utils/ApiError.js'

// Role check only — NOT an ownership check. "Is this user an admin" is a
// different question from "does this user own this specific resource";
// the latter belongs in each module's controller/service, not here.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'))
    }
    next()
  }
}

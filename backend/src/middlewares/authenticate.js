import { ApiError } from '#utils/ApiError.js'
import { verifyAccessToken } from '#utils/jwt.js'

// Stateless on purpose: verifies the JWT signature/expiry only, no DB hit.
// req.user is the minimal {id, role} carried in the token's own claims —
// any route that needs the full profile (e.g. GET /me) fetches it itself.
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication required'))
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    // Deliberately one generic message for both "expired" and "invalid
    // signature/malformed" — don't give an attacker a signal about which.
    next(ApiError.unauthorized('Invalid or expired access token'))
  }
}

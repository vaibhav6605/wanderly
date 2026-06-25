import { env } from '#config/env.js'

export const REFRESH_COOKIE_NAME = 'refreshToken'

// Scoped to /api/v1/auth, not the whole API — the refresh token is only
// ever needed by /refresh and /logout, so it's never sent on, say, every
// GET /listings request. Smaller exposure surface for the one cookie that
// matters most.
const COOKIE_PATH = '/api/v1/auth'

export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    // Cross-site in production (Vercel <-> Railway are different sites)
    // needs SameSite=None, which browsers only honor alongside Secure.
    // Locally over http://localhost, Lax is both sufficient and required
    // (None without Secure is rejected by the browser entirely).
    sameSite: env.isProduction ? 'none' : 'lax',
    path: COOKIE_PATH,
    maxAge: env.jwt.refreshExpiresMs,
  })
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: COOKIE_PATH,
  })
}

// select:false hides these fields from query *results*, not from an
// in-memory document a caller already holds (e.g. one that was just
// modified and is about to be returned in a response). Strip them
// explicitly here, once, rather than relying on every call site to
// remember which fields are sensitive.
const HIDDEN_FIELDS = [
  'password',
  'refreshTokens',
  'emailVerificationTokenHash',
  'emailVerificationExpires',
  'passwordResetTokenHash',
  'passwordResetExpires',
  'stripeCustomerId',
]

export function sanitizeUser(user) {
  const obj = user.toObject()
  for (const field of HIDDEN_FIELDS) {
    delete obj[field]
  }
  return obj
}

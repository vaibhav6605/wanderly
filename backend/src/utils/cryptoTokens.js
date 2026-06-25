import crypto from 'node:crypto'

// Shared by email verification, password reset, and refresh-token storage:
// generate a random token to hand to the client, but only ever persist its
// hash. A DB leak then yields nothing usable to forge a matching token.
export function generateRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

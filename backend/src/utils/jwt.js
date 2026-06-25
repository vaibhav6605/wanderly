import jwt from 'jsonwebtoken'
import { env } from '#config/env.js'

// Two separate secrets: a leaked access-token secret only lets an attacker
// forge 15-minute access tokens, not long-lived refresh tokens (and vice
// versa) — compromising one signing key doesn't compromise the other.
export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret)
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret)
}

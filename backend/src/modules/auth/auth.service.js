import crypto from 'node:crypto'
import { User } from '#models/User.js'
import { ApiError } from '#utils/ApiError.js'
import { generateRawToken, hashToken } from '#utils/cryptoTokens.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '#utils/jwt.js'
import { sendEmail } from '#config/mailer.js'
import { logger } from '#config/logger.js'
import { env } from '#config/env.js'

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000

// select:false hides these from query *results*, not from an in-memory
// document we already hold (e.g. one we just pushed a refresh token onto).
// Strip them explicitly before anything goes back to a client.
function toSafeUser(user) {
  const obj = user.toObject()
  delete obj.password
  delete obj.refreshTokens
  delete obj.emailVerificationTokenHash
  delete obj.emailVerificationExpires
  delete obj.passwordResetTokenHash
  delete obj.passwordResetExpires
  delete obj.stripeCustomerId
  return obj
}

async function issueTokenPair(user, deviceInfo) {
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role })

  // jti makes every refresh token unique even if issued in the same
  // millisecond for the same user (two devices logging in at once).
  const jti = crypto.randomUUID()
  const refreshToken = signRefreshToken({ sub: user._id.toString(), jti })

  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    deviceInfo,
    expiresAt: new Date(Date.now() + env.jwt.refreshExpiresMs),
  })
  await user.save()

  return { accessToken, refreshToken }
}

function buildVerificationEmail(rawToken) {
  const link = `${env.clientOrigins[0]}/verify-email?token=${rawToken}`
  return {
    subject: 'Verify your Wanderly email',
    html: `<p>Welcome to Wanderly. Confirm your email:</p><p><a href="${link}">${link}</a></p>`,
  }
}

function buildResetEmail(rawToken) {
  const link = `${env.clientOrigins[0]}/reset-password?token=${rawToken}`
  return {
    subject: 'Reset your Wanderly password',
    html: `<p>Reset your password (this link expires in 30 minutes):</p><p><a href="${link}">${link}</a></p>`,
  }
}

// A flaky email provider shouldn't fail the request that triggered the
// email — log it and move on. The user can always hit resend-verification
// or forgot-password again.
async function sendEmailSafely(emailPayload) {
  try {
    await sendEmail(emailPayload)
  } catch (err) {
    logger.error(`Failed to send email to ${emailPayload.to}: ${err.message}`)
  }
}

export async function registerUser({ name, email, password, deviceInfo }) {
  const existing = await User.findOne({ email })
  if (existing) {
    throw ApiError.conflict('An account with this email already exists')
  }

  const user = new User({ name, email, password })

  const rawToken = generateRawToken()
  user.emailVerificationTokenHash = hashToken(rawToken)
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)

  const { accessToken, refreshToken } = await issueTokenPair(user, deviceInfo)

  await sendEmailSafely({ to: user.email, ...buildVerificationEmail(rawToken) })

  return { user: toSafeUser(user), accessToken, refreshToken }
}

export async function loginUser({ email, password, deviceInfo }) {
  const user = await User.findOne({ email }).select('+password +refreshTokens')

  // Same generic message whether the email doesn't exist or the password
  // is wrong — distinguishing them lets an attacker enumerate registered
  // emails one guess at a time.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  if (user.isBanned) {
    throw ApiError.forbidden('This account has been suspended')
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, deviceInfo)
  return { user: toSafeUser(user), accessToken, refreshToken }
}

export async function refreshTokens({ refreshToken, deviceInfo }) {
  if (!refreshToken) {
    throw ApiError.unauthorized('No refresh token provided')
  }

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token')
  }

  const user = await User.findById(payload.sub).select('+refreshTokens')
  if (!user) {
    throw ApiError.unauthorized('Invalid or expired refresh token')
  }

  const tokenHash = hashToken(refreshToken)
  const matchIndex = user.refreshTokens.findIndex((entry) => entry.tokenHash === tokenHash)

  if (matchIndex === -1) {
    // The token's signature and expiry are valid, but it's not in the
    // allowlist — meaning it was already rotated out by an earlier refresh.
    // A legitimate client never presents an already-consumed token, so
    // this is the reuse-detection signal: blacklist (revoke) every
    // refresh token this user currently holds, on every device.
    user.refreshTokens = []
    await user.save()
    throw ApiError.unauthorized('Session expired, please log in again')
  }

  // Rotate: the presented token is consumed (removed) and a brand new
  // pair is issued. The old token can never be used again, even if it
  // hasn't technically expired yet.
  user.refreshTokens.splice(matchIndex, 1)
  return issueTokenPair(user, deviceInfo)
}

export async function logoutUser({ refreshToken }) {
  if (!refreshToken) return

  try {
    const payload = verifyRefreshToken(refreshToken)
    const user = await User.findById(payload.sub).select('+refreshTokens')
    if (user) {
      const tokenHash = hashToken(refreshToken)
      user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash)
      await user.save()
    }
  } catch {
    // Already invalid/expired — nothing left to revoke. Logout still
    // succeeds from the client's point of view once its cookie is cleared.
  }
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw ApiError.notFound('User not found')
  }
  return toSafeUser(user)
}

export async function verifyEmail({ token }) {
  const tokenHash = hashToken(token)
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires')

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token')
  }

  user.isEmailVerified = true
  user.emailVerificationTokenHash = null
  user.emailVerificationExpires = null
  await user.save()
}

export async function resendVerificationEmail(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw ApiError.notFound('User not found')
  }
  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified')
  }

  const rawToken = generateRawToken()
  user.emailVerificationTokenHash = hashToken(rawToken)
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
  await user.save()

  await sendEmailSafely({ to: user.email, ...buildVerificationEmail(rawToken) })
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email })
  // Deliberately silent on a miss — the controller always returns the same
  // generic message regardless, so this function must not let the caller
  // distinguish "sent" from "no such account" via a thrown error either.
  if (!user) return

  const rawToken = generateRawToken()
  user.passwordResetTokenHash = hashToken(rawToken)
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS)
  await user.save()

  await sendEmailSafely({ to: user.email, ...buildResetEmail(rawToken) })
}

export async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token)
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires +refreshTokens')

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token')
  }

  user.password = newPassword
  user.passwordResetTokenHash = null
  user.passwordResetExpires = null
  // A stolen session (if one existed) must not survive a password reset —
  // wipe every refresh token, on every device, not just this browser's.
  user.refreshTokens = []
  await user.save()
}

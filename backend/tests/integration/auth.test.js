import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { hashToken } from '../../src/utils/cryptoTokens.js'

const API = '/api/v1/auth'
const credentials = { name: 'Asha Rao', email: 'asha@example.com', password: 'password123' }

beforeAll(async () => {
  await connectTestDB()
  await User.init()
}, 60_000)

afterEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})

function extractCookie(res, name) {
  const setCookie = res.headers['set-cookie'] || []
  return setCookie.find((c) => c.startsWith(`${name}=`))
}

function cookieValue(cookieHeader) {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/refreshToken=([^;]+)/)
  return match ? match[1] : null
}

describe('POST /register', () => {
  it('creates a user, returns an access token, and sets a scoped httpOnly refresh cookie', async () => {
    const res = await request(app).post(`${API}/register`).send(credentials)

    expect(res.status).toBe(201)
    expect(res.body.data.user.email).toBe(credentials.email)
    expect(res.body.data.user.password).toBeUndefined()
    expect(res.body.data.user.refreshTokens).toBeUndefined()
    expect(res.body.data.accessToken).toBeTruthy()

    const cookie = extractCookie(res, 'refreshToken')
    expect(cookie).toBeTruthy()
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/)
  })

  it('rejects a duplicate email with 409', async () => {
    await request(app).post(`${API}/register`).send(credentials)
    const res = await request(app).post(`${API}/register`).send(credentials)
    expect(res.status).toBe(409)
  })

  it('rejects a password shorter than 8 characters with 422', async () => {
    const res = await request(app)
      .post(`${API}/register`)
      .send({ ...credentials, password: 'short' })
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /login', () => {
  beforeEach(async () => {
    await request(app).post(`${API}/register`).send(credentials)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: credentials.email, password: credentials.password })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()
    expect(extractCookie(res, 'refreshToken')).toBeTruthy()
  })

  it('rejects a wrong password and an unknown email with the identical message', async () => {
    const wrongPassword = await request(app)
      .post(`${API}/login`)
      .send({ email: credentials.email, password: 'wrongpassword' })
    const unknownEmail = await request(app)
      .post(`${API}/login`)
      .send({ email: 'nobody@example.com', password: 'whatever123' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message)
  })

  it('rejects a banned user even with the correct password', async () => {
    await User.updateOne({ email: credentials.email }, { isBanned: true })
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: credentials.email, password: credentials.password })
    expect(res.status).toBe(403)
  })
})

describe('refresh token rotation + reuse detection', () => {
  async function registerAndGetTokens() {
    const res = await request(app).post(`${API}/register`).send(credentials)
    return { refreshCookie: extractCookie(res, 'refreshToken') }
  }

  it('issues a brand new refresh token on every /refresh call', async () => {
    const { refreshCookie } = await registerAndGetTokens()

    const res = await request(app).post(`${API}/refresh`).set('Cookie', refreshCookie)
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()

    const newCookie = extractCookie(res, 'refreshToken')
    expect(cookieValue(newCookie)).not.toBe(cookieValue(refreshCookie))
  })

  it('rejects reuse of an already-rotated token and revokes the whole session', async () => {
    const { refreshCookie: original } = await registerAndGetTokens()

    const rotated = await request(app).post(`${API}/refresh`).set('Cookie', original)
    const rotatedCookie = extractCookie(rotated, 'refreshToken')

    // Presenting the original token again — it was already consumed.
    const reuse = await request(app).post(`${API}/refresh`).set('Cookie', original)
    expect(reuse.status).toBe(401)

    // Reuse must blacklist every session for this user, so even the token
    // that WAS valid a moment ago is now also rejected.
    const afterWipe = await request(app).post(`${API}/refresh`).set('Cookie', rotatedCookie)
    expect(afterWipe.status).toBe(401)
  })

  it('rejects a missing refresh token', async () => {
    const res = await request(app).post(`${API}/refresh`)
    expect(res.status).toBe(401)
  })
})

describe('POST /logout', () => {
  it('revokes the refresh token so it can no longer be used to refresh', async () => {
    const registerRes = await request(app).post(`${API}/register`).send(credentials)
    const refreshCookie = extractCookie(registerRes, 'refreshToken')

    const logoutRes = await request(app).post(`${API}/logout`).set('Cookie', refreshCookie)
    expect(logoutRes.status).toBe(200)

    const refreshAfterLogout = await request(app)
      .post(`${API}/refresh`)
      .set('Cookie', refreshCookie)
    expect(refreshAfterLogout.status).toBe(401)
  })

  it('succeeds even with no cookie at all (idempotent)', async () => {
    const res = await request(app).post(`${API}/logout`)
    expect(res.status).toBe(200)
  })
})

describe('GET /me (protected route)', () => {
  it('rejects a request with no access token', async () => {
    const res = await request(app).get(`${API}/me`)
    expect(res.status).toBe(401)
  })

  it('rejects a malformed bearer token', async () => {
    const res = await request(app).get(`${API}/me`).set('Authorization', 'Bearer garbage')
    expect(res.status).toBe(401)
  })

  it('returns the current user for a valid access token', async () => {
    const registerRes = await request(app).post(`${API}/register`).send(credentials)
    const { accessToken } = registerRes.body.data

    const res = await request(app).get(`${API}/me`).set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe(credentials.email)
    expect(res.body.data.user.password).toBeUndefined()
  })
})

describe('POST /verify-email', () => {
  async function registerWithKnownVerificationToken(rawToken, { expired = false } = {}) {
    await request(app).post(`${API}/register`).send(credentials)
    const user = await User.findOne({ email: credentials.email })
    user.emailVerificationTokenHash = hashToken(rawToken)
    user.emailVerificationExpires = new Date(Date.now() + (expired ? -1000 : 60_000))
    await user.save()
  }

  it('verifies the email with a valid, unexpired token', async () => {
    await registerWithKnownVerificationToken('known-raw-verification-token')

    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: 'known-raw-verification-token' })
    expect(res.status).toBe(200)

    const updated = await User.findOne({ email: credentials.email })
    expect(updated.isEmailVerified).toBe(true)
  })

  it('rejects a token that does not match any user', async () => {
    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: 'this-token-was-never-issued' })
    expect(res.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    await registerWithKnownVerificationToken('expired-raw-verification-token', { expired: true })

    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: 'expired-raw-verification-token' })
    expect(res.status).toBe(400)
  })
})

describe('POST /forgot-password and /reset-password', () => {
  it('responds with the identical message whether or not the email is registered', async () => {
    await request(app).post(`${API}/register`).send(credentials)

    const known = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: credentials.email })
    const unknown = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: 'nobody@example.com' })

    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(known.body.data.message).toBe(unknown.body.data.message)
  })

  it('resets the password with a valid token and revokes every existing session', async () => {
    const registerRes = await request(app).post(`${API}/register`).send(credentials)
    const oldRefreshCookie = extractCookie(registerRes, 'refreshToken')

    const user = await User.findOne({ email: credentials.email })
    user.passwordResetTokenHash = hashToken('known-raw-reset-token')
    user.passwordResetExpires = new Date(Date.now() + 60_000)
    await user.save()

    const resetRes = await request(app)
      .post(`${API}/reset-password`)
      .send({ token: 'known-raw-reset-token', newPassword: 'newpassword456' })
    expect(resetRes.status).toBe(200)

    const refreshAfterReset = await request(app)
      .post(`${API}/refresh`)
      .set('Cookie', oldRefreshCookie)
    expect(refreshAfterReset.status).toBe(401)

    const oldPasswordLogin = await request(app)
      .post(`${API}/login`)
      .send({ email: credentials.email, password: credentials.password })
    expect(oldPasswordLogin.status).toBe(401)

    const newPasswordLogin = await request(app)
      .post(`${API}/login`)
      .send({ email: credentials.email, password: 'newpassword456' })
    expect(newPasswordLogin.status).toBe(200)
  })

  it('rejects an invalid reset token', async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({ token: 'this-token-was-never-issued', newPassword: 'newpassword456' })
    expect(res.status).toBe(400)
  })
})

describe('POST /resend-verification', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(`${API}/resend-verification`)
    expect(res.status).toBe(401)
  })

  it('rejects when the email is already verified', async () => {
    const registerRes = await request(app).post(`${API}/register`).send(credentials)
    const { accessToken } = registerRes.body.data
    await User.updateOne({ email: credentials.email }, { isEmailVerified: true })

    const res = await request(app)
      .post(`${API}/resend-verification`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(400)
  })

  it('issues a new verification token when not yet verified', async () => {
    const registerRes = await request(app).post(`${API}/register`).send(credentials)
    const { accessToken } = registerRes.body.data
    const before = await User.findOne({ email: credentials.email }).select(
      '+emailVerificationTokenHash',
    )

    const res = await request(app)
      .post(`${API}/resend-verification`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)

    const after = await User.findOne({ email: credentials.email }).select(
      '+emailVerificationTokenHash',
    )
    expect(after.emailVerificationTokenHash).not.toBe(before.emailVerificationTokenHash)
  })
})

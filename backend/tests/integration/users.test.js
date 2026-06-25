import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'

const AUTH = '/api/v1/auth'
const USERS = '/api/v1/users'

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

async function registerUser(overrides = {}) {
  const credentials = {
    name: 'Asha Rao',
    email: 'asha@example.com',
    password: 'password123',
    ...overrides,
  }
  const res = await request(app).post(`${AUTH}/register`).send(credentials)
  return { accessToken: res.body.data.accessToken, user: res.body.data.user }
}

// Bypasses /register (which always creates role:'user') to seed an admin
// directly, then logs in for real — an access token's role claim is baked
// in at sign time, so a freshly-issued login token is required here, not
// just flipping the DB role and reusing an old token.
async function createAdminAndLogin() {
  const email = 'admin@wanderly.test'
  const password = 'adminpassword123'
  await User.create({ name: 'Admin', email, password, role: 'admin', isEmailVerified: true })
  const res = await request(app).post(`${AUTH}/login`).send({ email, password })
  return res.body.data.accessToken
}

describe('GET /api/v1/users (admin-only list)', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get(USERS)
    expect(res.status).toBe(401)
  })

  it('rejects a regular user with 403', async () => {
    const { accessToken } = await registerUser()
    const res = await request(app).get(USERS).set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(403)
  })

  it('allows an admin and returns paginated results', async () => {
    await registerUser()
    const adminToken = await createAdminAndLogin()

    const res = await request(app).get(USERS).set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.users)).toBe(true)
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(2) // the registered user + the admin
    expect(res.body.meta).toMatchObject({ page: 1, limit: 20 })
    expect(res.body.data.users[0].password).toBeUndefined()
  })
})

describe('GET /api/v1/users/:id and ban/role management', () => {
  it('rejects a regular user trying to view another user by id', async () => {
    const { user } = await registerUser()
    const { accessToken: otherToken } = await registerUser({ email: 'other@example.com' })

    const res = await request(app)
      .get(`${USERS}/${user.id ?? user._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(res.status).toBe(403)
  })

  it('lets an admin ban a user, after which that user cannot log in', async () => {
    const { user } = await registerUser()
    const adminToken = await createAdminAndLogin()

    const banRes = await request(app)
      .patch(`${USERS}/${user.id ?? user._id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: true })
    expect(banRes.status).toBe(200)
    expect(banRes.body.data.user.isBanned).toBe(true)

    const loginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: 'asha@example.com', password: 'password123' })
    expect(loginRes.status).toBe(403)
  })

  it("a promoted user's already-issued access token keeps the old role until they log in again", async () => {
    const { accessToken: staleToken, user } = await registerUser()
    const adminToken = await createAdminAndLogin()

    const roleRes = await request(app)
      .patch(`${USERS}/${user.id ?? user._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
    expect(roleRes.status).toBe(200)
    expect(roleRes.body.data.user.role).toBe('admin')

    // The token issued at registration still carries role:'user' in its
    // signed claims — promoting the DB row doesn't retroactively change it.
    const staleAttempt = await request(app).get(USERS).set('Authorization', `Bearer ${staleToken}`)
    expect(staleAttempt.status).toBe(403)

    // A fresh login re-signs the token with the new role.
    const freshLogin = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: 'asha@example.com', password: 'password123' })
    const freshAttempt = await request(app)
      .get(USERS)
      .set('Authorization', `Bearer ${freshLogin.body.data.accessToken}`)
    expect(freshAttempt.status).toBe(200)
  })
})

describe('PATCH /api/v1/users/me (self-service profile)', () => {
  it('lets a user update their own name and phone', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .patch(`${USERS}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Asha R.', phone: '+919876543210' })

    expect(res.status).toBe(200)
    expect(res.body.data.user.name).toBe('Asha R.')
    expect(res.body.data.user.phone).toBe('+919876543210')
  })

  it('silently strips fields outside the schema, e.g. a role-escalation attempt', async () => {
    const { accessToken } = await registerUser({ email: 'asha2@example.com' })

    const res = await request(app)
      .patch(`${USERS}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Still Just A User', role: 'admin', isBanned: false })
    expect(res.status).toBe(200)
    expect(res.body.data.user.role).toBe('user')

    const fromDb = await User.findOne({ email: 'asha2@example.com' })
    expect(fromDb.role).toBe('user')
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).patch(`${USERS}/me`).send({ name: 'Nope' })
    expect(res.status).toBe(401)
  })
})

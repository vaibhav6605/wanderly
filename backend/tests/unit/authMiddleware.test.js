import { authenticate } from '../../src/middlewares/authenticate.js'
import { authorize } from '../../src/middlewares/authorize.js'
import { signAccessToken } from '../../src/utils/jwt.js'

describe('authenticate middleware', () => {
  it('rejects a request with no Authorization header', () => {
    const next = jest.fn()
    authenticate({ headers: {} }, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(401)
  })

  it('rejects a malformed Authorization header', () => {
    const next = jest.fn()
    authenticate({ headers: { authorization: 'Token abc' } }, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(401)
  })

  it('rejects an invalid/tampered token', () => {
    const next = jest.fn()
    authenticate({ headers: { authorization: 'Bearer not-a-real-token' } }, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(401)
  })

  it('attaches req.user and calls next() with no error for a valid token', () => {
    const token = signAccessToken({ sub: 'user-id-123', role: 'admin' })
    const req = { headers: { authorization: `Bearer ${token}` } }
    const next = jest.fn()
    authenticate(req, {}, next)
    expect(next).toHaveBeenCalledWith()
    expect(req.user).toEqual({ id: 'user-id-123', role: 'admin' })
  })
})

describe('authorize middleware', () => {
  it('allows a matching role through', () => {
    const next = jest.fn()
    authorize('admin')({ user: { role: 'admin' } }, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects a non-matching role with 403', () => {
    const next = jest.fn()
    authorize('admin')({ user: { role: 'user' } }, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(403)
  })

  it('rejects when req.user is missing entirely', () => {
    const next = jest.fn()
    authorize('admin')({}, {}, next)
    expect(next.mock.calls[0][0].statusCode).toBe(403)
  })
})

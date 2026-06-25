import { ApiError } from '../../src/utils/ApiError.js'

describe('ApiError factories', () => {
  it('creates a 404 via notFound()', () => {
    const err = ApiError.notFound('Listing not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('Listing not found')
    expect(err.isOperational).toBe(true)
  })

  it('attaches field-level details on badRequest()', () => {
    const err = ApiError.badRequest('Invalid input', [{ path: 'email', message: 'required' }])
    expect(err.statusCode).toBe(400)
    expect(err.details).toHaveLength(1)
  })

  it('falls back to a default message when none is given', () => {
    const err = ApiError.unauthorized()
    expect(err.message).toBe('Unauthorized')
    expect(err.code).toBe('UNAUTHORIZED')
  })
})

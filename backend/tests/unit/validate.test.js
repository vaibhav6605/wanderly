import { z } from 'zod'
import { validate } from '../../src/middlewares/validate.js'

const schema = z.object({
  body: z.object({ title: z.string().min(3) }),
})

describe('validate middleware', () => {
  it('calls next() with no error when validation passes', () => {
    const req = { body: { title: 'Cozy cabin' }, query: {}, params: {} }
    const next = jest.fn()
    validate(schema)(req, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('strips unknown fields (mass-assignment protection)', () => {
    const req = { body: { title: 'Cozy cabin', role: 'admin' }, query: {}, params: {} }
    const next = jest.fn()
    validate(schema)(req, {}, next)
    expect(req.body).toEqual({ title: 'Cozy cabin' })
  })

  it('leaves req.query/req.params untouched when the schema does not define them', () => {
    const req = { body: { title: 'Cozy cabin' }, query: { page: '2' }, params: { id: '1' } }
    const next = jest.fn()
    validate(schema)(req, {}, next)
    expect(req.query).toEqual({ page: '2' })
    expect(req.params).toEqual({ id: '1' })
  })

  it('calls next(ApiError) with 422 when validation fails', () => {
    const req = { body: { title: 'a' }, query: {}, params: {} }
    const next = jest.fn()
    validate(schema)(req, {}, next)
    const errArg = next.mock.calls[0][0]
    expect(errArg.statusCode).toBe(422)
    expect(errArg.code).toBe('VALIDATION_ERROR')
    expect(errArg.details[0].path).toBe('body.title')
  })
})

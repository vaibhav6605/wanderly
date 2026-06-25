import express from 'express'
import request from 'supertest'
import mongoose from 'mongoose'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { ApiError } from '../../src/utils/ApiError.js'

function buildApp(routeHandler) {
  const app = express()
  app.get('/test', routeHandler)
  app.use(errorHandler)
  return app
}

describe('errorHandler', () => {
  it('formats a known ApiError as-is', async () => {
    const app = buildApp((req, res, next) => next(ApiError.notFound('nope')))
    const res = await request(app).get('/test')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: 'nope' } })
  })

  it('maps a Mongoose CastError to 400', async () => {
    const app = buildApp((req, res, next) => {
      next(new mongoose.Error.CastError('ObjectId', 'not-an-id', 'listingId'))
    })
    const res = await request(app).get('/test')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('maps a duplicate-key error to 409', async () => {
    const app = buildApp((req, res, next) => {
      const err = new Error('duplicate')
      err.code = 11000
      err.keyValue = { email: 'a@b.com' }
      next(err)
    })
    const res = await request(app).get('/test')
    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/email/)
  })

  it('normalizes an unexpected error to a 500 INTERNAL_ERROR', async () => {
    const app = buildApp(() => {
      throw new Error('boom: only shown because NODE_ENV=test, not production')
    })
    const res = await request(app).get('/test')
    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    // env.isProduction is false under NODE_ENV=test, so the real message
    // passes through here — in production it would be replaced with the
    // generic ApiError.internal() default instead (see normalizeError()).
    expect(res.body.error.message).toMatch(/boom/)
  })
})

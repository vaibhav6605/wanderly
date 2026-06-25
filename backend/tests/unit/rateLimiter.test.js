import express from 'express'
import request from 'supertest'
import { createRateLimiter } from '../../src/middlewares/rateLimiter.js'
import { errorHandler } from '../../src/middlewares/errorHandler.js'

describe('createRateLimiter', () => {
  it('returns a 429 ApiError once the limit is exceeded', async () => {
    const app = express()
    app.use(createRateLimiter({ windowMs: 60_000, max: 2 }))
    app.get('/ping', (req, res) => res.json({ ok: true }))
    app.use(errorHandler)

    const agent = request(app)
    await agent.get('/ping').expect(200)
    await agent.get('/ping').expect(200)
    const res = await agent.get('/ping')

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
  })
})

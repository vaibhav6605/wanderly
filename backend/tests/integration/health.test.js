import request from 'supertest'
import { app } from '../../src/app.js'

describe('GET /health', () => {
  it('returns 200 with an ok status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
  })
})

describe('unknown route', () => {
  it('returns a 404 in the standard error envelope', async () => {
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toMatch(/Route not found/)
  })
})

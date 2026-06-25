import request from 'supertest'
import { app } from '../../src/app.js'

describe('global middleware stack', () => {
  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('allows the configured client origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('rejects a disallowed CORS origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example.com')
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('exposes rate-limit headers on every response', async () => {
    const res = await request(app).get('/health')
    expect(res.headers).toHaveProperty('ratelimit-limit')
  })
})

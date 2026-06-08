import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './app'

describe('Express App', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/api/health')
      expect(res.headers['x-powered-by']).toBeUndefined()
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })
  })
})

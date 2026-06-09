import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './app'

describe('GET /api/health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/api/health')
    expect(res.statusCode).toEqual(200)
  })
})
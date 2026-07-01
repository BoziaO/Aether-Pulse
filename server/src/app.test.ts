import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// Stub environment variables BEFORE any imports
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing-only')
vi.stubEnv('SESSION_SECRET', 'test-session-secret-for-testing-123456789012')
vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test')
vi.stubEnv('PORT', '3000')
vi.stubEnv('SERVER_URL', 'http://localhost:3000')

// Mock the db module to prevent connection attempts
vi.mock('@workspace/db', () => ({
  connectDb: vi.fn().mockResolvedValue(undefined),
  mongoose: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
    },
  },
  User: {},
  Room: {},
  Message: {},
  DmMessage: {},
  DmConversation: {},
  Friendship: {},
  RoomMember: {},
  MessageReaction: {},
}))

let app: any

beforeAll(async () => {
  // Dynamic import after mocks are set up
  const module = await import('./app')
  app = module.default
})

describe('GET /api/health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/api/health')
    expect(res.statusCode).toEqual(200)
  })
})

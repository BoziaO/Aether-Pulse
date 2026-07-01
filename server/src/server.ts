import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { connectDb, disconnectDb } from '@workspace/db'

import app, { allowedOrigins } from './app'
import { registerSocketHandlers } from './socket'
import { logger } from './utils/logger'
import { env } from './config/env'

try {
  await connectDb()
  logger.info('Connected to MongoDB successfully')
} catch (error) {
  logger.error({ err: error }, 'Failed to connect to MongoDB')
  process.exit(1)
}

const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow Electron (file://) and other requests with no origin
      if (!origin) return callback(null, true)
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error('Socket.IO CORS: origin not allowed'))
    },
    credentials: true,
  },
  path: '/api/socket.io',
})

app.set('io', io)

const redisUrl = process.env['REDIS_URL']
if (redisUrl) {
  logger.info('REDIS_URL is set. Configuring Socket.io Redis adapter...')
  try {
    const { createAdapter } = await import('@socket.io/redis-adapter')
    const { default: Redis } = await import('ioredis')
    const pubClient = new Redis(redisUrl)
    const subClient = pubClient.duplicate()
    io.adapter(createAdapter(pubClient, subClient))
    logger.info('Socket.io Redis adapter successfully bound')
  } catch (err) {
    logger.error(
      { err },
      'Failed to configure Socket.io Redis adapter, falling back to in-memory adapter'
    )
  }
} else {
  logger.info('REDIS_URL not set. Running Socket.io with default in-memory adapter')
}

registerSocketHandlers(io)

function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, closing gracefully...')
  io.close(() => {
    logger.info('Socket.IO server closed')
  })
  httpServer.close(async () => {
    logger.info('HTTP server closed')
    await disconnectDb()
    process.exit(0)
  })
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server listening')
})

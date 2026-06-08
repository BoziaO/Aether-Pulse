import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import fs from 'node:fs'
import path from 'node:path'
import { rateLimit } from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import router from './routes'
import { logger } from './utils/logger'
import { jwtMiddleware, optionalJwtMiddleware } from './middleware/auth'

const app: Express = express()
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// Validate critical environment secrets
const jwtSecret = process.env.JWT_SECRET
const sessionSecret = process.env.SESSION_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required')
}
if (jwtSecret.length < 16) {
  logger.warn('JWT_SECRET is shorter than 16 characters! This is not secure for production.')
}

if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required')
}
if (sessionSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET must be at least 32 characters long to ensure cryptographically secure sessions'
  )
}

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
      ? [process.env.CLIENT_URL]
      : []
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']

// Configure CORS more securely
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0],
        }
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        }
      },
    },
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'anonymous'
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.url }, 'Rate limit exceeded')
    res.status(429).json({
      error: {
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    })
  },
})

// Apply rate limiting to API routes only
app.use('/api/', apiLimiter)

// Auth routes have lower rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit each IP to 10 auth requests per windowMs
  skip: (req) =>
    req.path !== '/api/auth/login' &&
    req.path !== '/api/auth/register' &&
    req.path !== '/api/auth/refresh',
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      },
    })
  },
})
app.use('/api/auth/', authLimiter)

const uploadsDir = path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/api/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }))

// Apply optional JWT to all API routes first
app.use('/api', optionalJwtMiddleware)

// Define protected routes that REQUIRE JWT
app.use('/api', (req, res, next) => {
  // Public paths under /api
  const publicPaths = ['/auth', '/health', '/uploads']
  const isPublic = publicPaths.some((p) => req.path === p || req.path.startsWith(`${p}/`))

  if (isPublic) {
    return next()
  }

  // If not public, ensure user is authenticated
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
    })
  }
  next()
})

app.use('/api', router)

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.status || err.statusCode || 500
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        ...err,
      },
      req: {
        method: req.method,
        url: req.url,
      },
    },
    'Unhandled error'
  )

  res.status(statusCode).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  })
})

export default app

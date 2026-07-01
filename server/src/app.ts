import fs from 'node:fs'
import path from 'node:path'
import express, { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { rateLimit } from 'express-rate-limit'

import router from './routes'
import { logger } from './utils/logger'
import { optionalJwtMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error'

const app: Express = express()
app.set('trust proxy', 1)

// Security middleware
const serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL

if (!serverUrl) {
  throw new Error('SERVER_URL or RENDER_EXTERNAL_URL must be configured')
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'blob:',
          'http:',
          'https:',
          'ws:',
          'wss:',
          serverUrl,
          serverUrl.replace('https://', 'wss://'),
        ],
        mediaSrc: ["'self'", 'blob:', 'https:'],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.youtube.com'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

// Validate critical environment secrets
const jwtSecret = process.env.JWT_SECRET
const sessionSecret = process.env.SESSION_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required')
}
if (jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters for production security')
}

if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required')
}
if (sessionSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET must be at least 32 characters long to ensure cryptographically secure sessions'
  )
}

const allowedOrigins: string[] =
  process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : ['http://localhost:5174', 'http://localhost:3000']

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  logger.warn('CLIENT_URL is not set — CORS will block all browser requests in production')
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Electron sends requests with no origin (file://) — always allow
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}

// Handle preflight before helmet so CORS headers are set first
app.options('/{*path}', cors(corsOptions))
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
  skip: (req) => {
    // req.path is relative to mount point (/api/auth/)
    // Only apply rate limiting to login, register, and refresh endpoints
    const authPaths = ['/login', '/register', '/refresh']
    return !authPaths.some((p) => req.path === p || req.path.endsWith(p))
  },
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'anonymous',
  handler: (_req, res) => {
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

// Root health check endpoint.
// Returns 200 OK so that process managers (wait-on, Docker healthchecks, load
// balancers) can detect that the server is up. Without this, GET / returns 404,
// which causes `wait-on http://localhost:3000` to hang forever and prevents
// Electron from launching in dev mode.
app.get('/', (_req, res) => {
  res.json({ status: 'ok' })
})

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
app.use(errorHandler)

export { allowedOrigins }
export default app

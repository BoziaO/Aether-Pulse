import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import 'express-session'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return (req as AuthenticatedRequest).user !== undefined
}

const jwtSecret = process.env.JWT_SECRET
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d'
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required')
}

export interface JwtPayload {
  userId: string
  username: string
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Generate JWT token pair (access + refresh)
 */
export function generateTokens(userId: string, username: string): TokenPair {
  const accessToken = jwt.sign({ userId, username }, jwtSecret!, {
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256',
  } as any)

  const refreshToken = jwt.sign({ userId, username }, jwtSecret!, {
    expiresIn: refreshExpiresIn,
    algorithm: 'HS256',
  } as any)

  return { accessToken, refreshToken }
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, jwtSecret!, { algorithms: ['HS256'] }) as any
    return payload as JwtPayload
  } catch {
    return null
  }
}

/**
 * Verify refresh token and return new access token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, jwtSecret!, { algorithms: ['HS256'] }) as any
    return payload as JwtPayload
  } catch {
    return null
  }
}

/**
 * Express middleware to authenticate JWT from Authorization header
 * Sets req.user with the decoded payload
 */
export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
    })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      },
    })
    return
  }

  // Attach user to request
  ;(req as AuthenticatedRequest).user = payload
  next()
}

/**
 * Optional JWT middleware - sets req.user if valid token present,
 * but doesn't fail if missing or invalid
 */
export function optionalJwtMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      ;(req as AuthenticatedRequest).user = payload
    }
  }

  next()
}

export function requireAuth(req: Request, res: Response): string | null {
  const userId = (req as AuthenticatedRequest).user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  return userId
}

declare module 'express-session' {
  interface SessionData {
    userId: string
    csrfToken: string
    csrfTokenExpires: number
  }
}

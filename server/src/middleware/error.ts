import { type Request, type Response, type NextFunction } from 'express'

import { AppError } from '../errors/AppError'
import { logger } from '../utils/logger'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode, message: err.message, url: req.url },
      'Operational error'
    )
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    })
    return
  }

  logger.error(
    {
      err: { message: err.message, stack: err.stack },
      req: { method: req.method, url: req.url },
    },
    'Unhandled error'
  )

  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      code: 'INTERNAL_ERROR',
    },
  })
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { message: 'Not found', code: 'NOT_FOUND' },
  })
}

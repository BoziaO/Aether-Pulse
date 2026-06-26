import { type Request, type Response, type NextFunction } from 'express'
import { type ZodSchema, ZodError } from 'zod'

import { logger } from '../utils/logger'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      logger.warn({ errors: result.error.errors, source }, 'Validation failed')
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      })
      return
    }
    req[source] = result.data
    next()
  }
}

export function validateAndTransform(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        logger.warn({ errors: err.errors }, 'Validation failed')
        res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: err.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        })
        return
      }
      next(err)
    }
  }
}

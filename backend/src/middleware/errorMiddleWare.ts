import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500
  const message =
    err instanceof ApiError ? err.message : 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
  })
}


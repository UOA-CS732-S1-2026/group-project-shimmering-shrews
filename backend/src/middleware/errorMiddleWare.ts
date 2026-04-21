import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error caught in handler:", {
    name: err.name,
    message: err.message,
    status: err instanceof ApiError ? err.statusCode : 500,
    stack: err.stack
  })

  const statusCode = err instanceof ApiError ? err.statusCode : 500
  const message =
    err instanceof ApiError ? err.message : err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
  })
}


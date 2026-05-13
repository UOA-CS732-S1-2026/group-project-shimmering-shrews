import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'

type HttpError = Error & {
  status?: number
  statusCode?: number
  type?: string
}

// Ensures the error is always an Error instance for consistent handling.
// Converts strings and unknown values to Error objects.
const normalizeError = (err: unknown): Error | ApiError | HttpError => {
  if (err instanceof Error) {
    return err
  }

  if (typeof err === 'string') {
    return new Error(err)
  }

  return new Error('Internal Server Error')
}

// Checks if a value is a valid HTTP error status code (400-599).
const isValidHttpStatus = (status: unknown): status is number => {
  return Number.isInteger(status) && Number(status) >= 400 && Number(status) < 600
}

// Extracts the HTTP status code from an error, falling back to 500 if not found.
const getStatusCode = (err: Error | ApiError | HttpError) => {
  if (err instanceof ApiError) {
    return err.statusCode
  }

  const httpError = err as HttpError

  if (isValidHttpStatus(httpError.statusCode)) {
    return httpError.statusCode
  }

  if (isValidHttpStatus(httpError.status)) {
    return httpError.status
  }

  return 500
}

// Extracts a user-friendly error message.
// Handles malformed JSON requests with a specific message.
const getMessage = (err: Error | ApiError | HttpError) => {
  const httpError = err as HttpError
  // Express sets type to 'entity.parse.failed' when the request body is invalid JSON
  if (err instanceof SyntaxError && httpError.type === 'entity.parse.failed') {
    return 'Invalid JSON request body'
  }

  return err.message || 'Internal Server Error'
}

// Global Express error handling middleware.
// Catches all errors passed via next(err) and returns a consistent JSON error response.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const normalizedError = normalizeError(err)
  const statusCode = getStatusCode(normalizedError)
  const message = getMessage(normalizedError)

  console.error("Error caught in handler:", {
    name: normalizedError.name,
    message: normalizedError.message,
    status: statusCode,
    stack: normalizedError.stack
  })

  res.status(statusCode).json({
    success: false,
    message,
  })
}


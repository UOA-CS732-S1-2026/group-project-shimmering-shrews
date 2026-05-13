import type { Response } from 'express'

type SuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

// Builds a standardized success response object.
// Ensures all success responses have a consistent shape across the API.
export const buildSuccessResponse = <T>(
  data: T,
  message?: string
): SuccessResponse<T> => {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  }

  if (message) {
    body.message = message
  }

  return body
}

// Sends a success response with the given data and optional message.
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
) => {
  return res.status(statusCode).json(buildSuccessResponse(data, message))
}

import type { Response } from 'express'

type SuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

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

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
) => {
  return res.status(statusCode).json(buildSuccessResponse(data, message))
}

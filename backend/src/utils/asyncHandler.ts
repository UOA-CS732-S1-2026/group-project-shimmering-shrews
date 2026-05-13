import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

// Wraps async route handlers to catch errors and pass them to Express error middleware.
// Eliminates the need for try-catch in every async route handler.
export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);

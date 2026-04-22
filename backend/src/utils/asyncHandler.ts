import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);

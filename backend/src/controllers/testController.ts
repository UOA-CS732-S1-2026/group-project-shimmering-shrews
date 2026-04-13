import { Request, Response } from 'express';
import { testDatabase } from '../services/testService';
import { asyncHandler } from '../utils/asyncHandler';

export const getTestDb = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await testDatabase();

  res.status(200).json({
    success: true,
    message: 'Test DB successful - current time retrieved',
    data,
  });
});
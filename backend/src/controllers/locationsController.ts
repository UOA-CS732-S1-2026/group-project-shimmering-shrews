import { Request, Response } from 'express';
import { addLocations } from '../services/locationsService';
import { asyncHandler } from '../utils/asyncHandler';

export const fetchAndCreateLocations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await addLocations();
  
  res.status(200).json({
    success: true,
    message: 'Locations added to database',
    data,
  });
});
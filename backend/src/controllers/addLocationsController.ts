import { Request, Response } from 'express';
import { addLocations } from '../services/addLocationsService';
import { asyncHandler } from '../utils/asyncHandler';

export const locations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await addLocations();

  res.status(200).json({
    success: true,
    message: 'Locations received from Geoapify and mapped',
    data,
  });
});
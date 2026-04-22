import { Request, Response } from 'express';
import { addLocations, fetchLocations } from '../services/locationService';
import { asyncHandler } from '../utils/asyncHandler';


export const fetchPlaces = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await fetchLocations();
  
  res.status(200).json({
    success: true,
    message: 'Locations fetched',
    data,
  });
});

export const fetchAndCreateLocations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await addLocations();
  
  res.status(200).json({
    success: true,
    message: 'Locations added to database',
    data,
  });
});
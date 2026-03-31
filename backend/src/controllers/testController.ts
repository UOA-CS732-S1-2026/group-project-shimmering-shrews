import { Request, Response } from 'express';
import { testDatabase } from '../services/testService';

export const getTestDb = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await testDatabase();

    res.status(200).json({
      success: true,
      message: 'Test DB successful - current time retrieved',
      data,
    });
  } catch (error) {
    console.error('Test DB error:', error);

    res.status(500).json({
      success: false,
      message: 'Test DB failed',
    });
  }
};
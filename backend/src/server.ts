import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('API is running with TypeScript');
});

app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


import pool from '../config/database';

export const testDatabase = async () => {
  const result = await pool.query('SELECT NOW() AS current_time');
  return result.rows[0];
};
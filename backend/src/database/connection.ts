import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;
let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    if (pool && isConnected) {
      logger.info('Database already connected');
      return;
    }

    pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'dynamic_form_system',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const client = await pool.connect();
    logger.info('Database connected successfully', {
      host: process.env.DATABASE_HOST || 'localhost',
      database: process.env.DATABASE_NAME || 'dynamic_form_system',
      user: process.env.DATABASE_USER || 'postgres'
    });
    
    client.release();
    isConnected = true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      isConnected = false;
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  if (!pool || !isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool || !isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

// 導出 pool 為了向後相容
export { pool };

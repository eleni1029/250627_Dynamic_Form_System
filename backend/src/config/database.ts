// backend/src/config/database.ts - 修復版本
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// 資料庫連接池
let pool: Pool | null = null;

// 從環境變數或 URL 解析資料庫配置
function getDatabaseConfig(): DatabaseConfig {
  if (process.env.DATABASE_URL) {
    // Railway 等雲端服務通常提供 DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
    };
  }

  // 本地開發配置
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'dynamic_form_system',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres123',
  };
}

// 連接資料庫
export async function connectDatabase(): Promise<void> {
  try {
    const config = getDatabaseConfig();
    
    logger.info('Connecting to database...', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });

    pool = new Pool({
      ...config,
      max: 20, // 最大連接數
      idleTimeoutMillis: 30000, // 空閒連接超時 30 秒
      connectionTimeoutMillis: 10000, // 連接超時 10 秒
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // 測試連接
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();

    logger.info('Database connection established successfully', {
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version.split(' ').slice(0, 2).join(' ')
    });

    // 設置連接池事件監聽
    pool.on('connect', (client: PoolClient) => {
      logger.debug('New database client connected');
    });

    pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle database client', err);
    });

    pool.on('remove', () => {
      logger.debug('Database client removed from pool');
    });

  } catch (error: any) {
    logger.error('Failed to connect to database:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// 獲取資料庫連接池（安全版本）
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

// 安全的資料庫連接池獲取（返回 null 而不是拋出錯誤）
export function getPoolSafe(): Pool | null {
  return pool;
}

// 檢查資料庫是否已連接
export function isDatabaseConnected(): boolean {
  return pool !== null;
}

// 執行查詢的輔助函數
export async function query(text: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text,
      params,
      error
    });
    throw error;
  } finally {
    client.release();
  }
}

// 事務處理輔助函數
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 關閉資料庫連接
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

// 檢查資料庫連接狀態
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  stats?: any;
  error?: string;
}> {
  try {
    if (!pool) {
      return { connected: false, error: 'Pool not initialized' };
    }

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return {
      connected: true,
      stats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message
    };
  }
}
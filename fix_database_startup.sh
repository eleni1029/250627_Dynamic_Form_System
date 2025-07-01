#!/bin/bash

echo "🔧 修復資料庫啟動順序問題"
echo "=========================="

# ===== 1. 修復 app.ts - 延遲路由初始化 =====
echo "📝 修復 app.ts..."

cat > backend/src/app.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import path from 'path';
import { connectDatabase } from './database/connection';
import { logger } from './utils/logger';
import { sessionConfig } from './config/session';

const app = express();
const PORT = process.env.PORT || 3000;

// 基本中間件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session 配置
app.use(session(sessionConfig));

// 靜態檔案服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 基本健康檢查（不依賴資料庫）
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      session: 'active'
    }
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Form System Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 啟動服務器
async function startServer() {
  try {
    // 先連接資料庫
    await connectDatabase();
    logger.info('Database connected successfully');

    // 資料庫連接成功後，再導入並設置路由
    const authRoutes = (await import('./routes/auth.routes')).default;
    const userRoutes = (await import('./routes/user.routes')).default;
    const adminRoutes = (await import('./routes/admin.routes')).default;
    const projectsRoutes = (await import('./routes/projects.routes')).default;

    // 註冊 API 路由
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/projects', projectsRoutes);

    // 更新健康檢查以包含資料庫狀態
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          session: 'active',
          auth: 'ready',
          projects: {
            bmi: 'ready',
            tdee: 'ready'
          }
        }
      });
    });

    // 404 處理
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.path
      });
    });

    // 錯誤處理
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', err);
      res.status(err.status || 500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    });

    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🏥 API Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;
EOF

# ===== 2. 修復 BMI Model - 延遲池初始化 =====
echo "📝 修復 BMI Model..."

cat > backend/src/projects/bmi/models/BMIRecord.ts << 'EOF'
import { Pool } from 'pg';
import { logger } from '../../../utils/logger';

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  age?: number;
  gender?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: string;
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  isHealthy: boolean;
}

export class BMIModel {
  private getPool(): Pool {
    // 延遲導入 pool，確保資料庫已連接
    const { pool } = require('../../../database/connection');
    return pool;
  }

  async create(userId: string, data: BMICalculationRequest & BMICalculationResult): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (user_id, height, weight, bmi, category, age, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        userId,
        data.height,
        data.weight,
        data.bmi,
        data.category,
        data.age || null,
        data.gender || null
      ];

      const result = await this.getPool().query(query, values);
      logger.debug(`BMI record created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<BMIRecord[]> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await this.getPool().query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding BMI records:', error);
      throw new Error('Failed to find BMI records');
    }
  }

  async findLatestByUserId(userId: string): Promise<BMIRecord | null> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.getPool().query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM bmi_records WHERE id = $1 AND user_id = $2 RETURNING id`;
      const result = await this.getPool().query(query, [recordId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM bmi_records WHERE user_id = $1 RETURNING id`;
      const result = await this.getPool().query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error clearing BMI history:', error);
      throw new Error('Failed to clear BMI history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM bmi_records WHERE user_id = $1`;
      const result = await this.getPool().query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting BMI record count:', error);
      throw new Error('Failed to get BMI record count');
    }
  }
}
EOF

# ===== 3. 修復資料庫連接配置 =====
echo "📝 修復資料庫連接..."

cat > backend/src/database/connection.ts << 'EOF'
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
EOF

# ===== 4. 創建快速資料庫初始化腳本 =====
echo "📝 創建資料庫初始化腳本..."

cat > backend/init-database.sh << 'EOF'
#!/bin/bash

echo "🔧 初始化資料庫"
echo "=============="

# 檢查 PostgreSQL 是否運行
if ! nc -z localhost 5432 2>/dev/null; then
    echo "❌ PostgreSQL 未運行在 localhost:5432"
    echo "請確保 PostgreSQL 正在運行或使用 Docker:"
    echo "docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL 連接正常"

# 運行資料庫初始化
npm run init-db

echo "🎉 資料庫初始化完成"
EOF

chmod +x backend/init-database.sh

echo ""
echo "🎯 修復完成！主要改動："
echo "✅ 修復了 app.ts 的啟動順序 - 先連接資料庫再載入路由"
echo "✅ 修復了 BMI Model 的池初始化 - 使用延遲載入"
echo "✅ 改善了資料庫連接管理"
echo "✅ 創建了資料庫初始化腳本"
echo ""
echo "🚀 現在可以嘗試啟動："
echo "1. cd backend && npm run init-db  # 初始化資料庫"
echo "2. cd backend && npm run dev      # 啟動後端"
// backend/src/app.ts - 修復版本
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase } from './config/database';
import { sessionConfig } from './config/session';
import { logger } from './utils/logger';

// 路由導入
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import projectsRoutes from './routes/projects.routes';

// 中間件導入
import { authMiddleware } from './middleware/auth.middleware';
import { adminMiddleware } from './middleware/admin.middleware';

// 環境變數載入
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 安全性中間件配置 =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com']
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 請求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 15分鐘內最多 100 個請求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ===== 基礎中間件 =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session 配置
app.use(session(sessionConfig));

// 靜態文件服務（用戶頭像）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 請求日誌中間件 =====
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ===== 路由註冊 =====
// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Dynamic Form System Backend is running!'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/admin', adminMiddleware, adminRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Form System Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      user: '/api/user',
      admin: '/api/admin',
      projects: '/api/projects'
    }
  });
});

// ===== 錯誤處理中間件 =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path
  });
});

// 全域錯誤處理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error:', err);

  // 開發環境顯示詳細錯誤
  if (process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      code: err.code || 'INTERNAL_SERVER_ERROR'
    });
  } else {
    // 生產環境隱藏敏感錯誤資訊
    res.status(err.status || 500).json({
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ===== 服務器啟動 =====
async function startServer() {
  try {
    // 連接資料庫（暫時模擬）
    await connectDatabase();
    logger.info('Database connected successfully');

    // 啟動服務器
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api`);
      
      // 顯示可用的路由
      console.log('\n📍 Available routes:');
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/test`);
      console.log(`   GET  http://localhost:${PORT}/api/user/test`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/test`);
      console.log(`   GET  http://localhost:${PORT}/api/projects/test`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 優雅關閉處理
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 啟動服務器
startServer();

export default app;
// backend/src/app.ts - 更新版本（使用完整認證系統）
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

// 靜態文件服務（用戶頭像和上傳文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 請求日誌中間件 =====
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.session?.user?.id,
      isAdmin: req.session?.isAdmin
    });
  });
  
  next();
});

// ===== 健康檢查 =====
app.get('/health', async (req, res) => {
  try {
    // 可以添加資料庫連接檢查
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      message: 'Dynamic Form System Backend is running!',
      services: {
        database: 'connected', // 實際檢查資料庫狀態
        session: 'active',
        auth: 'ready'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// ===== API 路由註冊 =====
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectsRoutes);

// ===== 根路徑 =====
app.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Form System Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        adminLogin: 'POST /api/auth/admin/login',
        logout: 'POST /api/auth/logout',
        status: 'GET /api/auth/status'
      },
      user: {
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile',
        uploadAvatar: 'POST /api/user/avatar',
        projects: 'GET /api/user/projects'
      },
      admin: '/api/admin',
      projects: '/api/projects'
    },
    documentation: 'https://your-docs-url.com'
  });
});

// ===== 404 處理 =====
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ===== 全域錯誤處理 =====
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.session?.user?.id
  });

  // 處理特定類型的錯誤
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details
    });
    return;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'File too large',
      code: 'FILE_TOO_LARGE'
    });
    return;
  }

  // 開發環境顯示詳細錯誤
  if (process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    // 生產環境隱藏敏感錯誤資訊
    res.status(err.status || 500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===== 服務器啟動 =====
async function startServer() {
  try {
    // 連接資料庫
    await connectDatabase();
    logger.info('Database connected successfully');

    // 啟動服務器
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api`);
      
      // 顯示可用的認證路由
      console.log('\n🔐 Authentication endpoints:');
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   POST http://localhost:${PORT}/api/auth/admin/login`);
      console.log(`   POST http://localhost:${PORT}/api/auth/logout`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/status`);
      
      console.log('\n👤 User endpoints:');
      console.log(`   GET  http://localhost:${PORT}/api/user/profile`);
      console.log(`   PUT  http://localhost:${PORT}/api/user/profile`);
      console.log(`   POST http://localhost:${PORT}/api/user/avatar`);
      console.log(`   GET  http://localhost:${PORT}/api/user/projects`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🧪 Development test endpoints:');
        console.log(`   GET  http://localhost:${PORT}/api/auth/test`);
        console.log(`   GET  http://localhost:${PORT}/api/auth/test/auth`);
        console.log(`   GET  http://localhost:${PORT}/api/auth/test/admin`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ===== 優雅關閉處理 =====
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 啟動服務器
startServer();

export default app;
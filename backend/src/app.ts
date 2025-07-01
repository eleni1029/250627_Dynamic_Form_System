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

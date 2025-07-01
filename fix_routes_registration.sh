#!/bin/bash

echo "🔧 修復路由註冊問題"
echo "=================="

# ===== 修復 app.ts 的路由註冊 =====
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
    logger.info('Loading routes...');
    
    const authRoutes = (await import('./routes/auth.routes')).default;
    const userRoutes = (await import('./routes/user.routes')).default;
    const adminRoutes = (await import('./routes/admin.routes')).default;
    const projectsRoutes = (await import('./routes/projects.routes')).default;

    // 註冊 API 路由
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/projects', projectsRoutes);

    logger.info('Routes registered successfully', {
      auth: '/api/auth',
      user: '/api/user',
      admin: '/api/admin',
      projects: '/api/projects'
    });

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

    // 調試路由 - 列出所有註冊的路由
    app.get('/api/debug/routes', (req, res) => {
      const routes: string[] = [];
      app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              const basePath = middleware.regexp.source.replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/');
              routes.push(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${basePath}${handler.route.path}`);
            }
          });
        }
      });
      
      res.json({
        success: true,
        routes: routes,
        count: routes.length
      });
    });

    // 404 處理
    app.use((req, res) => {
      logger.warn('Route not found', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      
      res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.path,
        method: req.method
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
      logger.info(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
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

echo ""
echo "✅ 修復完成！主要改動："
echo "1. 改善了路由載入的日誌記錄"
echo "2. 添加了調試路由 /api/debug/routes"
echo "3. 改善了 404 錯誤記錄"
echo ""
echo "🚀 重新啟動後端："
echo "cd backend && npm run dev"
echo ""
echo "🔍 啟動後可以檢查："
echo "curl http://localhost:3000/api/debug/routes"
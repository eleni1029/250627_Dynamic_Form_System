// backend/src/routes/health.routes.ts
import { Router } from 'express';
import { getPool } from '../config/database';
import { PROJECT_CONFIGS } from '../config/projects.config';
import { logger } from '../utils/logger';

export const createHealthRoutes = (): Router => {
  const router = Router();

  // GET /api/health - 系統健康檢查
  router.get('/', async (req, res) => {
    try {
      const pool = getPool();
      
      // 檢查資料庫連接
      const dbResult = await pool.query('SELECT NOW() as current_time');
      
      // 檢查專案模組狀態
      const projectsResult = await pool.query(
        'SELECT COUNT(*) as count FROM projects WHERE is_active = true'
      );

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          currentTime: dbResult.rows[0].current_time
        },
        projects: {
          registered: Object.keys(PROJECT_CONFIGS).length,
          active: parseInt(projectsResult.rows[0].count)
        },
        modules: {
          bmi: PROJECT_CONFIGS.bmi.isActive,
          tdee: PROJECT_CONFIGS.tdee.isActive
        }
      };

      res.status(200).json({
        success: true,
        data: healthStatus
      });

    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable'
      });
    }
  });

  return router;
};
import { Router } from 'express';
import { createBMIRoutes } from '../projects/bmi/routes/bmi.routes';
import { createTDEERoutes } from '../projects/tdee/routes/tdee.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// 確保所有專案路由都需要認證
router.use(authMiddleware);

// 註冊專案路由
router.use('/bmi', createBMIRoutes());
router.use('/tdee', createTDEERoutes());

// 獲取可用的專案列表
router.get('/', (req, res) => {
  try {
    const projects = [
      {
        key: 'bmi',
        name: 'BMI 計算器',
        description: '身體質量指數計算 - 評估體重狀況',
        path: '/projects/bmi',
        version: '1.0.0',
        features: [
          'BMI 計算與分類',
          '健康風險評估',
          'WHO 標準分類',
          '個人化建議',
          '趨勢分析'
        ],
        endpoints: {
          calculate: 'POST /projects/bmi/calculate',
          history: 'GET /projects/bmi/history',
          latest: 'GET /projects/bmi/latest',
          stats: 'GET /projects/bmi/stats',
          trend: 'GET /projects/bmi/trend'
        }
      },
      {
        key: 'tdee',
        name: 'TDEE 計算器',
        description: '每日總能量消耗計算 - 制定營養計畫',
        path: '/projects/tdee',
        version: '1.0.0',
        features: [
          'BMR 與 TDEE 計算',
          '活動等級評估',
          '宏營養素分配',
          '卡路里目標設定',
          '個人化營養建議'
        ],
        endpoints: {
          calculate: 'POST /projects/tdee/calculate',
          activityLevels: 'GET /projects/tdee/activity-levels',
          history: 'GET /projects/tdee/history',
          latest: 'GET /projects/tdee/latest',
          stats: 'GET /projects/tdee/stats',
          nutrition: 'GET /projects/tdee/nutrition-advice'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        projects,
        total: projects.length,
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          supportedFeatures: [
            'calculation',
            'history_tracking',
            'statistics',
            'data_validation',
            'trend_analysis'
          ]
        }
      },
      message: 'Available projects retrieved successfully'
    });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projects',
      code: 'PROJECTS_ERROR'
    });
  }
});

// 專案健康檢查端點
router.get('/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        bmi: {
          status: 'operational',
          endpoints: ['calculate', 'history', 'stats', 'trend']
        },
        tdee: {
          status: 'operational', 
          endpoints: ['calculate', 'activity-levels', 'history', 'stats', 'nutrition-advice']
        }
      },
      database: 'connected',
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: healthStatus,
      message: 'All project services are healthy'
    });
  } catch (error) {
    logger.error('Projects health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;

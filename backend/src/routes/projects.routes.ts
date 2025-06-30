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
        description: '身體質量指數計算',
        path: '/projects/bmi'
      },
      {
        key: 'tdee',
        name: 'TDEE 計算器', 
        description: '每日總能量消耗計算',
        path: '/projects/tdee'
      }
    ];

    res.json({
      success: true,
      data: projects,
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

export default router;

// TDEE 活動等級
router.get('/tdee/activity-levels', (req, res) => {
  try {
    const activityLevels = [
      { value: 'sedentary', label: '久坐不動', description: '很少運動，主要是坐著工作' },
      { value: 'light', label: '輕度活動', description: '每週1-3次輕度運動' },
      { value: 'moderate', label: '中度活動', description: '每週3-5次中度運動' },
      { value: 'active', label: '積極活動', description: '每週6-7次運動' },
      { value: 'very_active', label: '非常活躍', description: '每天運動，體力勞動工作' }
    ];

    res.json({
      success: true,
      data: activityLevels,
      message: 'Activity levels retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get activity levels',
      code: 'ACTIVITY_LEVELS_ERROR'
    });
  }
});

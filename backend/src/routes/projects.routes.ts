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

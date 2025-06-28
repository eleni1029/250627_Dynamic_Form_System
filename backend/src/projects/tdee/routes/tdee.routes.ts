// ===== TDEE 專案模組 - Part 3 =====
// backend/src/projects/tdee/routes/tdee.routes.ts

import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation } from '../middleware/tdee.validation';

export const createTDEERoutes = (): Router => {
  const router = Router();
  const tdeeController = new TDEEController();

  // 所有 TDEE 路由都需要用戶認證
  router.use(authMiddleware);

  // POST /calculate - TDEE 計算
  router.post('/calculate', validateTDEECalculation, tdeeController.calculate);

  // GET /history - 獲取歷史記錄
  router.get('/history', tdeeController.getHistory);

  // GET /latest - 獲取最新記錄（用於表單預填）
  router.get('/latest', tdeeController.getLatest);

  // GET /activity-levels - 獲取活動等級配置
  router.get('/activity-levels', tdeeController.getActivityLevels);

  // DELETE /records/:id - 刪除特定記錄
  router.delete('/records/:id', tdeeController.deleteRecord);

  // DELETE /history - 清空所有歷史記錄
  router.delete('/history', tdeeController.clearHistory);

  return router;
};

// ===== TDEE 專案模組 - Part 3 =====
// backend/src/projects/tdee/middleware/tdee.validation.ts

import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

// TDEE 計算專用驗證中間件
export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level } = req.body;

    // 檢查必要欄位
    if (!height || !weight || !age || !gender || !activity_level) {
      res.status(400).json({
        success: false,
        error: 'All fields are required for TDEE calculation: height, weight, age, gender, activity_level',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = parseInt(age);

    if (isNaN(numHeight) || isNaN(numWeight) || isNaN(numAge)) {
      res.status(400).json({
        success: false,
        error: 'Height, weight, and age must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 身高範圍驗證 (50-300cm)
    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    // 體重範圍驗證 (10-500kg)
    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    // 年齡範圍驗證 (1-150歲)
    if (numAge < 1 || numAge > 150) {
      res.status(400).json({
        success: false,
        error: 'Age must be between 1-150 years',
        code: 'INVALID_AGE_RANGE'
      });
      return;
    }

    // 性別驗證 (TDEE 必須指定性別)
    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be either male or female',
        code: 'INVALID_GENDER'
      });
      return;
    }

    // 活動等級驗證
    if (!ACTIVITY_LEVELS[activity_level as keyof typeof ACTIVITY_LEVELS]) {
      const validLevels = Object.keys(ACTIVITY_LEVELS).join(', ');
      res.status(400).json({
        success: false,
        error: `Activity level must be one of: ${validLevels}`,
        code: 'INVALID_ACTIVITY_LEVEL'
      });
      return;
    }

    // 將驗證後的數值存回 req.body
    req.body.height = numHeight;
    req.body.weight = numWeight;
    req.body.age = numAge;

    next();

  } catch (error) {
    logger.error('TDEE validation error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE validation processing error',
      code: 'TDEE_VALIDATION_ERROR'
    });
  }
};

// ===== TDEE 專案模組 - Part 3 =====
// backend/src/projects/tdee/index.ts - TDEE 模組主入口

import { Router } from 'express';
import { createTDEERoutes } from './routes/tdee.routes';
import { TDEEService } from './services/TDEEService';

// TDEE 模組配置
export const TDEE_PROJECT_CONFIG = {
  key: 'tdee',
  name: 'TDEE Calculator',
  name_zh: 'TDEE 計算器',
  description: 'Total Daily Energy Expenditure calculator with Mifflin-St Jeor equation',
  description_zh: '基於 Mifflin-St Jeor 方程式的總日消耗熱量計算器',
  version: '1.0.0',
  route: '/api/projects/tdee',
  icon: 'fire',
  isActive: true,
  permissions: ['tdee_access'],
  features: [
    'BMR calculation using Mifflin-St Jeor equation',
    'Activity level multipliers',
    'Calorie recommendations for weight goals',
    'BMI calculation and health suggestions'
  ],
  created_at: new Date()
};

// TDEE 模組路由註冊
export const registerTDEEModule = (app: any): void => {
  const tdeeRoutes = createTDEERoutes();
  app.use('/api/projects/tdee', tdeeRoutes);
  
  console.log(`✅ TDEE module registered at ${TDEE_PROJECT_CONFIG.route}`);
};

// 導出 TDEE 服務 (供其他模組使用)
export { TDEEService };
export * from './types/tdee.types';

// ===== 專案模組總配置 =====
// backend/src/config/projects.config.ts

import { BMI_PROJECT_CONFIG, registerBMIModule } from '../projects/bmi';
import { TDEE_PROJECT_CONFIG, registerTDEEModule } from '../projects/tdee';

// 所有專案模組配置
export const PROJECT_CONFIGS = {
  bmi: BMI_PROJECT_CONFIG,
  tdee: TDEE_PROJECT_CONFIG
} as const;

// 專案模組註冊函數
export const registerAllProjectModules = (app: any): void => {
  console.log('🚀 Registering project modules...');
  
  try {
    // 註冊 BMI 模組
    registerBMIModule(app);
    
    // 註冊 TDEE 模組
    registerTDEEModule(app);
    
    console.log('✅ All project modules registered successfully');
    console.log('📊 Available projects:', Object.keys(PROJECT_CONFIGS));
    
  } catch (error) {
    console.error('❌ Error registering project modules:', error);
    throw error;
  }
};

// 獲取用戶可訪問的專案列表
export const getUserAccessibleProjects = (userPermissions: string[]) => {
  const accessibleProjects = [];
  
  for (const [key, config] of Object.entries(PROJECT_CONFIGS)) {
    // 檢查用戶是否有訪問該專案的權限
    const hasPermission = config.permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (hasPermission && config.isActive) {
      accessibleProjects.push({
        key: config.key,
        name: config.name,
        name_zh: config.name_zh,
        description: config.description,
        description_zh: config.description_zh,
        icon: config.icon,
        route: config.route
      });
    }
  }
  
  return accessibleProjects;
};

// 驗證專案是否存在且用戶有權限訪問
export const validateProjectAccess = (projectKey: string, userPermissions: string[]): boolean => {
  const project = PROJECT_CONFIGS[projectKey as keyof typeof PROJECT_CONFIGS];
  
  if (!project || !project.isActive) {
    return false;
  }
  
  return project.permissions.some(permission => 
    userPermissions.includes(permission)
  );
};

// ===== 專案模組路由總入口 =====
// backend/src/routes/projects.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserAccessibleProjects, validateProjectAccess, PROJECT_CONFIGS } from '../config/projects.config';

export const createProjectsRoutes = (): Router => {
  const router = Router();

  // 所有專案相關路由都需要認證
  router.use(authMiddleware);

  // GET /api/projects - 獲取用戶可訪問的專案列表
  router.get('/', (req, res) => {
    try {
      const userPermissions = req.session.user?.permissions || [];
      const accessibleProjects = getUserAccessibleProjects(userPermissions);

      res.json({
        success: true,
        data: accessibleProjects,
        message: `Found ${accessibleProjects.length} accessible projects`
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get accessible projects',
        code: 'GET_PROJECTS_ERROR'
      });
    }
  });

  // GET /api/projects/:projectKey - 獲取特定專案資訊
  router.get('/:projectKey', (req, res) => {
    try {
      const { projectKey } = req.params;
      const userPermissions = req.session.user?.permissions || [];

      if (!validateProjectAccess(projectKey, userPermissions)) {
        res.status(403).json({
          success: false,
          error: 'Project access denied or project not found',
          code: 'PROJECT_ACCESS_DENIED'
        });
        return;
      }

      const project = PROJECT_CONFIGS[projectKey as keyof typeof PROJECT_CONFIGS];
      
      res.json({
        success: true,
        data: {
          key: project.key,
          name: project.name,
          name_zh: project.name_zh,
          description: project.description,
          description_zh: project.description_zh,
          icon: project.icon,
          route: project.route,
          features: project.features || []
        },
        message: 'Project information retrieved successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get project information',
        code: 'GET_PROJECT_INFO_ERROR'
      });
    }
  });

  return router;
};

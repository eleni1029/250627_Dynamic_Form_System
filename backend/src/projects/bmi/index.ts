// ===== backend/src/projects/bmi/index.ts =====
import { Router } from 'express';
import { createBMIRoutes } from './routes/bmi.routes';
import { BMIService } from './services/BMIService';

// BMI 模組配置
export const BMI_PROJECT_CONFIG = {
  key: 'bmi',
  name: 'BMI Calculator',
  name_zh: 'BMI 計算器',
  description: 'Body Mass Index calculator with WHO international standards',
  description_zh: '基於 WHO 國際標準的身體質量指數計算器',
  version: '1.0.0',
  route: '/api/projects/bmi',
  icon: 'calculator',
  isActive: true,
  permissions: ['bmi_access'],
  features: [
    'WHO international BMI standards',
    'BMI calculation and categorization',
    'Health recommendations',
    'User input history tracking'
  ],
  created_at: new Date()
};

// BMI 模組路由註冊
export const registerBMIModule = (app: any): void => {
  const bmiRoutes = createBMIRoutes();
  app.use('/api/projects/bmi', bmiRoutes);
  
  console.log(`✅ BMI module registered at ${BMI_PROJECT_CONFIG.route}`);
};

// 導出 BMI 服務 (供其他模組使用)
export { BMIService };
export * from './types/bmi.types';

// ===== backend/src/projects/tdee/index.ts =====
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

// ===== backend/src/projects/bmi/routes/bmi.routes.ts =====
import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  const bmiController = new BMIController();

  // 所有 BMI 路由都需要用戶認證
  router.use(authMiddleware);

  // POST /calculate - BMI 計算
  router.post('/calculate', validateBodyMetrics, bmiController.calculate);

  // GET /history - 獲取歷史記錄
  router.get('/history', bmiController.getHistory);

  // GET /latest - 獲取最新記錄（用於表單預填）
  router.get('/latest', bmiController.getLatest);

  // DELETE /records/:id - 刪除特定記錄
  router.delete('/records/:id', bmiController.deleteRecord);

  // DELETE /history - 清空所有歷史記錄
  router.delete('/history', bmiController.clearHistory);

  return router;
};

// ===== backend/src/projects/tdee/routes/tdee.routes.ts =====
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

  // GET /stats - 獲取用戶統計資訊
  router.get('/stats', tdeeController.getUserStats);

  // DELETE /records/:id - 刪除特定記錄
  router.delete('/records/:id', tdeeController.deleteRecord);

  // DELETE /history - 清空所有歷史記錄
  router.delete('/history', tdeeController.clearHistory);

  // POST /validate - 驗證計算數據（測試用）
  router.post('/validate', tdeeController.validateData);

  return router;
};
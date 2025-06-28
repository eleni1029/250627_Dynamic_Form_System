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
// ===== BMI 專案模組 - Part 2 =====
// backend/src/projects/bmi/controllers/BMIController.ts

import { Request, Response } from 'express';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest, BMIHistoryQuery } from '../types/bmi.types';
import { logger } from '../../../utils/logger';

export class BMIController {
  private bmiService: BMIService;

  constructor() {
    this.bmiService = new BMIService();
  }

  // POST /api/projects/bmi/calculate - BMI 計算
  calculate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const calculationData: BMICalculationRequest = {
        height: parseFloat(req.body.height),
        weight: parseFloat(req.body.weight),
        age: req.body.age ? parseInt(req.body.age) : undefined,
        gender: req.body.gender
      };

      // 基本數值驗證
      if (isNaN(calculationData.height) || isNaN(calculationData.weight)) {
        res.status(400).json({
          success: false,
          error: 'Height and weight must be valid numbers',
          code: 'INVALID_INPUT_FORMAT'
        });
        return;
      }

      // 範圍驗證
      if (calculationData.height < 50 || calculationData.height > 300) {
        res.status(400).json({
          success: false,
          error: 'Height must be between 50-300 cm',
          code: 'INVALID_HEIGHT_RANGE'
        });
        return;
      }

      if (calculationData.weight < 10 || calculationData.weight > 500) {
        res.status(400).json({
          success: false,
          error: 'Weight must be between 10-500 kg',
          code: 'INVALID_WEIGHT_RANGE'
        });
        return;
      }

      if (calculationData.age !== undefined && (calculationData.age < 1 || calculationData.age > 150)) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }

      // 執行計算
      const result = await this.bmiService.calculate(userId, calculationData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI calculation controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during BMI calculation',
        code: 'BMI_CALCULATION_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/bmi/history - 獲取歷史記錄
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const query: BMIHistoryQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      // 驗證分頁參數
      if (query.page < 1) query.page = 1;
      if (query.limit < 1 || query.limit > 50) query.limit = 10;

      const result = await this.bmiService.getHistory(userId, query.page, query.limit);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI get history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI history',
        code: 'BMI_HISTORY_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/bmi/latest - 獲取最新記錄
  getLatest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const result = await this.bmiService.getLatestRecord(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI get latest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest BMI record',
        code: 'BMI_LATEST_SERVER_ERROR'
      });
    }
  };

  // DELETE /api/projects/bmi/records/:id - 刪除記錄
  deleteRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      const recordId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      if (!recordId) {
        res.status(400).json({
          success: false,
          error: 'Record ID is required',
          code: 'MISSING_RECORD_ID'
        });
        return;
      }

      const result = await this.bmiService.deleteRecord(userId, recordId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error) {
      logger.error('BMI delete record controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting BMI record',
        code: 'BMI_DELETE_SERVER_ERROR'
      });
    }
  };

  // DELETE /api/projects/bmi/history - 清空歷史記錄
  clearHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const result = await this.bmiService.clearHistory(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI clear history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_SERVER_ERROR'
      });
    }
  };
}

// ===== BMI 專案模組 - Part 2 =====
// backend/src/projects/bmi/routes/bmi.routes.ts

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

// ===== BMI 專案模組 - Part 2 =====
// backend/src/projects/bmi/index.ts - BMI 模組主入口

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

// ===== BMI 專案模組驗證中間件增強 =====
// backend/src/middleware/validation.middleware.ts (BMI 專用部分)

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 身體指標驗證中間件
export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    // 檢查必要欄位
    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 身高範圍驗證 (國際標準: 50-300cm)
    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    // 體重範圍驗證 (國際標準: 10-500kg)
    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    // 年齡驗證 (可選欄位)
    if (age !== undefined) {
      const numAge = parseInt(age);
      if (isNaN(numAge) || numAge < 1 || numAge > 150) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }
    }

    // 性別驗證 (可選欄位)
    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(gender)) {
        res.status(400).json({
          success: false,
          error: 'Gender must be male, female, or other',
          code: 'INVALID_GENDER'
        });
        return;
      }
    }

    // 將驗證後的數值存回 req.body
    req.body.height = numHeight;
    req.body.weight = numWeight;
    if (age) req.body.age = parseInt(age);

    next();

  } catch (error) {
    logger.error('Body metrics validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation processing error',
      code: 'VALIDATION_ERROR'
    });
  }
};
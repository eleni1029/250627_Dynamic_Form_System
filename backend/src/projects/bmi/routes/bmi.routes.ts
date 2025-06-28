// ===== 檔案 1: backend/src/projects/bmi/routes/bmi.routes.ts =====
import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics, validateIdParam } from '../../../middleware/validation.middleware';

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

  // GET /stats - 獲取用戶統計資訊
  router.get('/stats', bmiController.getUserStats);

  // DELETE /records/:id - 刪除特定記錄
  router.delete('/records/:id', validateIdParam('id'), bmiController.deleteRecord);

  // DELETE /history - 清空所有歷史記錄
  router.delete('/history', bmiController.clearHistory);

  // POST /validate - 驗證計算數據（測試用）
  router.post('/validate', validateBodyMetrics, bmiController.validateData);

  return router;
};

// ===== 檔案 2: backend/src/projects/tdee/routes/tdee.routes.ts =====
import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation } from '../middleware/tdee.validation';
import { validateIdParam } from '../../../middleware/validation.middleware';

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
  router.delete('/records/:id', validateIdParam('id'), tdeeController.deleteRecord);

  // DELETE /history - 清空所有歷史記錄
  router.delete('/history', tdeeController.clearHistory);

  // POST /validate - 驗證計算數據（測試用）
  router.post('/validate', validateTDEECalculation, tdeeController.validateData);

  return router;
};

// ===== 檔案 3: backend/src/projects/bmi/middleware/bmi.validation.ts =====
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';

// BMI 計算專用驗證中間件（擴展版本，支援可選欄位）
export const validateBMICalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    // 檢查必要欄位 - BMI 只需要身高和體重
    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required for BMI calculation',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = age ? parseInt(age) : undefined;

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
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

    // 年齡驗證（可選欄位）
    if (numAge !== undefined) {
      if (isNaN(numAge) || numAge < 1 || numAge > 150) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }
    }

    // 性別驗證（可選欄位）
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be male, female, or other',
        code: 'INVALID_GENDER'
      });
      return;
    }

    // 將驗證後的數值存回 req.body
    req.body.height = numHeight;
    req.body.weight = numWeight;
    if (numAge !== undefined) {
      req.body.age = numAge;
    }

    next();

  } catch (error) {
    logger.error('BMI validation error:', error);
    res.status(500).json({
      success: false,
      error: 'BMI validation processing error',
      code: 'BMI_VALIDATION_ERROR'
    });
  }
};

// BMI 歷史查詢參數驗證
export const validateBMIHistoryQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page, limit, startDate, endDate } = req.query;

    // 驗證分頁參數
    if (page) {
      const pageNum = parseInt(page as string);
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          error: 'Page must be a positive integer',
          code: 'INVALID_PAGE_PARAMETER'
        });
        return;
      }
    }

    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1-100',
          code: 'INVALID_LIMIT_PARAMETER'
        });
        return;
      }
    }

    // 驗證日期參數
    if (startDate) {
      const startDateObj = new Date(startDate as string);
      if (isNaN(startDateObj.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid start date format',
          code: 'INVALID_START_DATE'
        });
        return;
      }
    }

    if (endDate) {
      const endDateObj = new Date(endDate as string);
      if (isNaN(endDateObj.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid end date format',
          code: 'INVALID_END_DATE'
        });
        return;
      }
    }

    // 驗證日期範圍邏輯
    if (startDate && endDate) {
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);
      
      if (startDateObj > endDateObj) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
        return;
      }
    }

    next();

  } catch (error) {
    logger.error('BMI history query validation error:', error);
    res.status(500).json({
      success: false,
      error: 'BMI history query validation processing error',
      code: 'BMI_HISTORY_VALIDATION_ERROR'
    });
  }
};
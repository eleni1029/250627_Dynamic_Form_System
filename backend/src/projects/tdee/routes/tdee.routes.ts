import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation, validateTDEERecordAccess, validateActivityLevel } from '../middleware/tdee.validation';
import { validatePagination, validateDateRange, sanitizeInput } from '../../../middleware/validation.middleware';

export const createTDEERoutes = (): Router => {
  const router = Router();
  const tdeeController = new TDEEController();

  // 應用中間件
  router.use(authMiddleware);
  router.use(sanitizeInput);

  // TDEE 計算
  router.post('/calculate', 
    validateTDEECalculation, 
    tdeeController.calculate
  );

  // 獲取活動等級列表（無需額外驗證）
  router.get('/activity-levels', 
    tdeeController.getActivityLevels
  );

  // 獲取歷史記錄
  router.get('/history', 
    validatePagination,
    validateDateRange,
    tdeeController.getHistory
  );

  // 獲取最新記錄
  router.get('/latest', 
    tdeeController.getLatest
  );

  // 獲取用戶統計
  router.get('/stats', 
    tdeeController.getUserStats
  );

  // 獲取營養建議
  router.get('/nutrition-advice',
    tdeeController.getNutritionAdvice
  );

  // 數據驗證端點
  router.post('/validate', 
    validateTDEECalculation, 
    tdeeController.validateData
  );

  // 驗證活動等級
  router.post('/validate-activity',
    validateActivityLevel,
    (req, res) => {
      res.json({
        success: true,
        data: { valid: true, activityLevel: req.body.activity_level },
        message: 'Activity level is valid'
      });
    }
  );

  // 刪除特定記錄
  router.delete('/records/:id', 
    validateTDEERecordAccess, 
    tdeeController.deleteRecord
  );

  // 清空歷史記錄
  router.delete('/history', 
    tdeeController.clearHistory
  );

  return router;
};

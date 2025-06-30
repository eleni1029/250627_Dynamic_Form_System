import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBMICalculation, validateBMIRecordAccess } from '../middleware/bmi.validation';
import { validatePagination, validateDateRange, sanitizeInput } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  const bmiController = new BMIController();

  // 應用中間件
  router.use(authMiddleware);
  router.use(sanitizeInput);

  // BMI 計算
  router.post('/calculate', 
    validateBMICalculation, 
    bmiController.calculate
  );

  // 獲取歷史記錄
  router.get('/history', 
    validatePagination,
    validateDateRange,
    bmiController.getHistory
  );

  // 獲取最新記錄
  router.get('/latest', 
    bmiController.getLatest
  );

  // 獲取用戶統計
  router.get('/stats', 
    bmiController.getUserStats
  );

  // 獲取趨勢分析
  router.get('/trend',
    bmiController.getTrend
  );

  // 數據驗證端點
  router.post('/validate', 
    validateBMICalculation, 
    bmiController.validateData
  );

  // 刪除特定記錄
  router.delete('/records/:id', 
    validateBMIRecordAccess, 
    bmiController.deleteRecord
  );

  // 清空歷史記錄
  router.delete('/history', 
    bmiController.clearHistory
  );

  return router;
};

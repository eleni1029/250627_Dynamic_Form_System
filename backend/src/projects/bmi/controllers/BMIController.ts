// ===== 修復檔案 3: backend/src/projects/bmi/controllers/BMIController.ts =====
// 修復認證邏輯、完善控制器方法、統一類型使用

import { Request, Response } from 'express';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest, BMIHistoryQuery } from '../types/bmi.types';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { logger } from '../../../utils/logger';

export class BMIController {
  private bmiService: BMIService;

  constructor() {
    this.bmiService = new BMIService();
  }

  // POST /api/projects/bmi/calculate - BMI 計算
  calculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // 從中間件已驗證的 body 中獲取數據
      const calculationData: BMICalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender
      };

      // 執行計算
      const result = await this.bmiService.calculate(userId, calculationData);

      if (result.success) {
        logger.info(`BMI calculated for user ${userId}`, {
          bmi: result.data?.bmi,
          category: result.data?.category,
          userId
        });
        
        res.status(200).json(result);
      } else {
        logger.warn(`BMI calculation failed for user ${userId}`, {
          error: result.error,
          userId
        });
        
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
  getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const query: BMIHistoryQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      // 驗證分頁參數
      if (query.page < 1) query.page = 1;
      if (query.limit < 1 || query.limit > 50) query.limit = 10;

      const result = await this.bmiService.getHistory(userId, query.page, query.limit);

      if (result.success) {
        logger.debug(`BMI history retrieved for user ${userId}`, {
          page: query.page,
          limit: query.limit,
          recordCount: result.data?.length || 0
        });
        
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

  // GET /api/projects/bmi/latest - 獲取最新記錄（用於表單預填）
  getLatest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const result = await this.bmiService.getLatestRecord(userId);

      if (result.success) {
        logger.debug(`Latest BMI record retrieved for user ${userId}`, {
          hasRecord: !!result.data
        });
        
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

  // DELETE /api/projects/bmi/records/:id - 刪除特定記錄
  deleteRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const recordId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
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
        logger.info(`BMI record deleted by user ${userId}`, {
          recordId,
          userId
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
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

  // DELETE /api/projects/bmi/history - 清空所有歷史記錄
  clearHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const result = await this.bmiService.clearHistory(userId);

      if (result.success) {
        logger.info(`BMI history cleared by user ${userId}`, {
          userId
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI clear history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_HISTORY_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/bmi/stats - 獲取用戶統計資訊
  getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const result = await this.bmiService.getUserStats(userId);

      if (result.success) {
        logger.debug(`BMI stats retrieved for user ${userId}`);
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI get stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI stats',
        code: 'BMI_STATS_SERVER_ERROR'
      });
    }
  };

  // POST /api/projects/bmi/validate - 驗證計算數據（測試用）
  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const calculationData: BMICalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender
      };

      const validation = this.bmiService.validateCalculationData(calculationData);

      logger.debug(`BMI data validation for user ${userId}`, {
        isValid: validation.isValid,
        errors: validation.errors
      });

      res.status(200).json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Data is valid' : 'Data validation failed'
      });

    } catch (error) {
      logger.error('BMI validate data controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating BMI data',
        code: 'BMI_VALIDATE_SERVER_ERROR'
      });
    }
  };
}
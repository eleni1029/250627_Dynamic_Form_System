// ===== 修復檔案 4: backend/src/projects/tdee/controllers/TDEEController.ts =====
// 修復認證邏輯、完善控制器方法、統一類型使用

import { Request, Response } from 'express';
import { TDEEService } from '../services/TDEEService';
import { TDEECalculationRequest, TDEEHistoryQuery, ACTIVITY_LEVELS } from '../types/tdee.types';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { logger } from '../../../utils/logger';

export class TDEEController {
  private tdeeService: TDEEService;

  constructor() {
    this.tdeeService = new TDEEService();
  }

  // POST /api/projects/tdee/calculate - TDEE 計算
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
      const calculationData: TDEECalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender,
        activity_level: req.body.activity_level
      };

      // 執行計算
      const result = await this.tdeeService.calculate(userId, calculationData);

      if (result.success) {
        logger.info(`TDEE calculated for user ${userId}`, {
          bmr: result.data?.bmr,
          tdee: result.data?.tdee,
          bmi: result.data?.bmi,
          userId
        });
        
        res.status(200).json(result);
      } else {
        logger.warn(`TDEE calculation failed for user ${userId}`, {
          error: result.error,
          userId
        });
        
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE calculation controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during TDEE calculation',
        code: 'TDEE_CALCULATION_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/history - 獲取歷史記錄
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

      const query: TDEEHistoryQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      // 驗證分頁參數
      if (query.page < 1) query.page = 1;
      if (query.limit < 1 || query.limit > 50) query.limit = 10;

      const result = await this.tdeeService.getHistory(userId, query.page, query.limit);

      if (result.success) {
        logger.debug(`TDEE history retrieved for user ${userId}`, {
          page: query.page,
          limit: query.limit,
          recordCount: result.data?.length || 0
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE get history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE history',
        code: 'TDEE_HISTORY_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/latest - 獲取最新記錄（用於表單預填）
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

      const result = await this.tdeeService.getLatestRecord(userId);

      if (result.success) {
        logger.debug(`Latest TDEE record retrieved for user ${userId}`, {
          hasRecord: !!result.data
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE get latest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest TDEE record',
        code: 'TDEE_LATEST_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/activity-levels - 獲取活動等級配置
  getActivityLevels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      // 返回活動等級配置
      const activityLevels = Object.values(ACTIVITY_LEVELS).map(level => ({
        key: level.key,
        name: level.name,
        name_en: level.name_en,
        description: level.description,
        description_en: level.description_en,
        multiplier: level.multiplier
      }));

      logger.debug(`Activity levels retrieved for user ${userId}`);

      res.status(200).json({
        success: true,
        data: activityLevels,
        message: 'Activity levels retrieved successfully'
      });

    } catch (error) {
      logger.error('TDEE get activity levels controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting activity levels',
        code: 'TDEE_ACTIVITY_LEVELS_SERVER_ERROR'
      });
    }
  };

  // DELETE /api/projects/tdee/records/:id - 刪除特定記錄
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

      const result = await this.tdeeService.deleteRecord(userId, recordId);

      if (result.success) {
        logger.info(`TDEE record deleted by user ${userId}`, {
          recordId,
          userId
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE delete record controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting TDEE record',
        code: 'TDEE_DELETE_SERVER_ERROR'
      });
    }
  };

  // DELETE /api/projects/tdee/history - 清空所有歷史記錄
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

      const result = await this.tdeeService.clearHistory(userId);

      if (result.success) {
        logger.info(`TDEE history cleared by user ${userId}`, {
          userId
        });
        
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE clear history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing TDEE history',
        code: 'TDEE_CLEAR_HISTORY_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/stats - 獲取用戶統計資訊
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

      const result = await this.tdeeService.getUserStats(userId);

      if (result.success) {
        logger.debug(`TDEE stats retrieved for user ${userId}`);
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE get stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE stats',
        code: 'TDEE_STATS_SERVER_ERROR'
      });
    }
  };

  // POST /api/projects/tdee/validate - 驗證計算數據（測試用）
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

      const calculationData: TDEECalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender,
        activity_level: req.body.activity_level
      };

      const validation = this.tdeeService.validateCalculationData(calculationData);

      logger.debug(`TDEE data validation for user ${userId}`, {
        isValid: validation.isValid,
        errors: validation.errors
      });

      res.status(200).json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Data is valid' : 'Data validation failed'
      });

    } catch (error) {
      logger.error('TDEE validate data controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating TDEE data',
        code: 'TDEE_VALIDATE_SERVER_ERROR'
      });
    }
  };
}
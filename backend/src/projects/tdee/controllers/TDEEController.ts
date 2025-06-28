// ===== TDEE 專案模組完整版 =====
// backend/src/projects/tdee/controllers/TDEEController.ts

import { Request, Response } from 'express';
import { TDEEService } from '../services/TDEEService';
import { TDEECalculationRequest, TDEEHistoryQuery } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEEController {
  private tdeeService: TDEEService;

  constructor() {
    this.tdeeService = new TDEEService();
  }

  // POST /api/projects/tdee/calculate - TDEE 計算
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

      const calculationData: TDEECalculationRequest = {
        height: parseFloat(req.body.height),
        weight: parseFloat(req.body.weight),
        age: parseInt(req.body.age),
        gender: req.body.gender,
        activity_level: req.body.activity_level
      };

      // 基本數值驗證
      if (isNaN(calculationData.height) || isNaN(calculationData.weight) || isNaN(calculationData.age)) {
        res.status(400).json({
          success: false,
          error: 'Height, weight, and age must be valid numbers',
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

      if (calculationData.age < 1 || calculationData.age > 150) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }

      // 性別驗證
      if (!['male', 'female'].includes(calculationData.gender)) {
        res.status(400).json({
          success: false,
          error: 'Gender must be either male or female',
          code: 'INVALID_GENDER'
        });
        return;
      }

      // 活動等級驗證
      const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      if (!validActivityLevels.includes(calculationData.activity_level)) {
        res.status(400).json({
          success: false,
          error: 'Invalid activity level',
          code: 'INVALID_ACTIVITY_LEVEL'
        });
        return;
      }

      // 執行計算
      const result = await this.tdeeService.calculate(userId, calculationData);

      if (result.success) {
        res.status(200).json(result);
      } else {
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

      const query: TDEEHistoryQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      // 驗證分頁參數
      if (query.page < 1) query.page = 1;
      if (query.limit < 1 || query.limit > 50) query.limit = 10;

      const result = await this.tdeeService.getHistory(userId, query.page, query.limit);

      if (result.success) {
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

  // GET /api/projects/tdee/latest - 獲取最新記錄
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

      const result = await this.tdeeService.getLatestRecord(userId);

      if (result.success) {
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

  // DELETE /api/projects/tdee/records/:id - 刪除記錄
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

      const result = await this.tdeeService.deleteRecord(userId, recordId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
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

  // DELETE /api/projects/tdee/history - 清空歷史記錄
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

      const result = await this.tdeeService.clearHistory(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE clear history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing TDEE history',
        code: 'TDEE_CLEAR_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/activity-levels - 獲取活動等級配置
  getActivityLevels = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = this.tdeeService.getActivityLevels();
      res.status(200).json(result);

    } catch (error) {
      logger.error('TDEE get activity levels controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting activity levels',
        code: 'TDEE_ACTIVITY_LEVELS_SERVER_ERROR'
      });
    }
  };

  // GET /api/projects/tdee/stats - 獲取用戶統計資訊
  getUserStats = async (req: Request, res: Response): Promise<void> => {
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

      const result = await this.tdeeService.getUserStats(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE get user stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting user statistics',
        code: 'TDEE_STATS_SERVER_ERROR'
      });
    }
  };

  // POST /api/projects/tdee/validate - 驗證計算數據（測試用）
  validateData = async (req: Request, res: Response): Promise<void> => {
    try {
      const calculationData: TDEECalculationRequest = {
        height: parseFloat(req.body.height),
        weight: parseFloat(req.body.weight),
        age: parseInt(req.body.age),
        gender: req.body.gender,
        activity_level: req.body.activity_level
      };

      const validation = this.tdeeService.validateCalculationData(calculationData);

      res.status(200).json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Data is valid' : 'Data validation failed'
      });

    } catch (error) {
      logger.error('TDEE validate data controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during data validation',
        code: 'TDEE_VALIDATION_SERVER_ERROR'
      });
    }
  };
}
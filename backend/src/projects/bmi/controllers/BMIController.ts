// ===== 檔案 4: backend/src/projects/bmi/controllers/BMIController.ts =====

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
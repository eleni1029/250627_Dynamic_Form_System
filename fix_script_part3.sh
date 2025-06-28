#!/bin/bash

# ===== 修復腳本 Part 3 修正版 =====
echo "🚀 修復執行修復腳本 Part 3..."

# 8. 修復 BMI 控制器
echo "📝 修復 BMI 控制器..."
cat > backend/src/projects/bmi/controllers/BMIController.ts << 'BMIEOF'
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

      const calculationData: BMICalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender
      };

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

      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

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
      res.status(200).json(result);

    } catch (error) {
      logger.error('BMI get latest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest BMI record',
        code: 'BMI_LATEST_SERVER_ERROR'
      });
    }
  };

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

      const result = await this.bmiService.deleteRecord(userId, recordId);
      res.status(200).json(result);

    } catch (error) {
      logger.error('BMI delete record controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting BMI record',
        code: 'BMI_DELETE_SERVER_ERROR'
      });
    }
  };

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
      res.status(200).json(result);

    } catch (error) {
      logger.error('BMI clear history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_HISTORY_SERVER_ERROR'
      });
    }
  };

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
      res.status(200).json(result);

    } catch (error) {
      logger.error('BMI get stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI stats',
        code: 'BMI_STATS_SERVER_ERROR'
      });
    }
  };

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
BMIEOF

echo "✅ 修復腳本 Part 3 修正版完成!"
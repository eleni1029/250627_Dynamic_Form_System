#!/bin/bash

# ===== 修復腳本 Part 3 =====
echo "🚀 執行修復腳本 Part 3 - BMI 控制器..."

# 9. 修復 BMI 控制器
echo "📝 修復 BMI 控制器..."
cat > backend/src/projects/bmi/controllers/BMIController.ts << 'EOF'
import { Request, Response } from 'express';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest } from '../models/BMIRecord';
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

      const result = await this.bmiService.calculateAndSave(userId, calculationData);

      if (result.success) {
        logger.info(`BMI calculated for user ${userId}`, {
          bmi: result.data?.bmi,
          category: result.data?.category
        });
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('BMI calculation controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating BMI',
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

      const limit = parseInt(req.query.limit as string) || 50;
      const result = await this.bmiService.getHistory(userId, limit);

      logger.debug(`BMI history retrieved for user ${userId}`, {
        recordCount: result.data?.length || 0
      });

      res.status(200).json(result);

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

      const result = await this.bmiService.getLatest(userId);
      
      if (result.success) {
        logger.debug(`Latest BMI retrieved for user ${userId}`);
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error) {
      logger.error('BMI get latest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest BMI',
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

      const result = await this.bmiService.deleteRecord(recordId, userId);

      if (result.success) {
        logger.info(`BMI record ${recordId} deleted for user ${userId}`);
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
        logger.info(`BMI history cleared for user ${userId}`, {
          deletedCount: result.data?.deletedCount
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
EOF

echo "✅ 修復腳本 Part 3 完成!"
echo "📝 已修復："
echo "   - BMI 控制器"
echo ""
echo "🔄 請執行 Part 4 修復腳本..."
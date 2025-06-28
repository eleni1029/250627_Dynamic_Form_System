#!/bin/bash

# ===== 修復腳本 Part 4 =====
echo "🚀 執行修復腳本 Part 4 - TDEE 控制器..."

# 10. 修復 TDEE 控制器
echo "📝 修復 TDEE 控制器..."
cat > backend/src/projects/tdee/controllers/TDEEController.ts << 'EOF'
import { Request, Response } from 'express';
import { TDEEService } from '../services/TDEEService';
import { TDEECalculationRequest } from '../models/TDEERecord';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEEController {
  private tdeeService: TDEEService;

  constructor() {
    this.tdeeService = new TDEEService();
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

      const calculationData: TDEECalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender,
        activity_level: req.body.activity_level
      };

      const result = await this.tdeeService.calculateAndSave(userId, calculationData);

      if (result.success) {
        logger.info(`TDEE calculated for user ${userId}`, {
          bmr: result.data?.bmr,
          tdee: result.data?.tdee,
          activity_level: calculationData.activity_level
        });
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('TDEE calculation controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating TDEE',
        code: 'TDEE_CALCULATION_SERVER_ERROR'
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
      const result = await this.tdeeService.getHistory(userId, limit);

      logger.debug(`TDEE history retrieved for user ${userId}`, {
        recordCount: result.data?.length || 0
      });

      res.status(200).json(result);

    } catch (error) {
      logger.error('TDEE get history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE history',
        code: 'TDEE_HISTORY_SERVER_ERROR'
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

      const result = await this.tdeeService.getLatest(userId);
      
      if (result.success) {
        logger.debug(`Latest TDEE retrieved for user ${userId}`);
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error) {
      logger.error('TDEE get latest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest TDEE',
        code: 'TDEE_LATEST_SERVER_ERROR'
      });
    }
  };

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

      const activityLevels = Object.entries(ACTIVITY_LEVELS).map(([key, value]) => ({
        key,
        name: value.name,
        description: value.description,
        multiplier: value.multiplier
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

      const result = await this.tdeeService.deleteRecord(recordId, userId);

      if (result.success) {
        logger.info(`TDEE record ${recordId} deleted for user ${userId}`);
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
        logger.info(`TDEE history cleared for user ${userId}`, {
          deletedCount: result.data?.deletedCount
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
EOF

echo "✅ 修復腳本 Part 4 完成!"
echo "📝 已修復："
echo "   - TDEE 控制器"
echo ""
echo "🔄 請執行 Part 5 修復腳本..."
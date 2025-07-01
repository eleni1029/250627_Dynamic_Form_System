import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest } from '../types';
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

      const request = req.body as BMICalculationRequest;
      
      // 驗證數據
      const validation = await this.bmiService.validateBMIData(request);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid BMI data',
          code: 'BMI_DATA_INVALID',
          details: validation.errors
        });
        return;
      }

      // 計算 BMI
      const result = await this.bmiService.calculateBMI(request);
      
      // 保存記錄
      const record = await this.bmiService.saveBMIRecord(userId, request, result);

      logger.info(`BMI calculated for user ${userId}`, { 
        bmi: result.bmi, 
        category: result.category,
        recordId: record.id
      });
      
      res.status(201).json({
        success: true,
        data: {
          calculation: result,
          input: request,
          record: {
            id: record.id,
            created_at: record.created_at
          }
        },
        message: 'BMI calculated and saved successfully'
      });

    } catch (error) {
      logger.error('BMI calculation error:', error);
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
      const history = await this.bmiService.getUserBMIHistory(userId, limit);

      res.json({
        success: true,
        data: {
          records: history,
          total: history.length,
          limit: limit
        },
        message: 'BMI history retrieved successfully'
      });
    } catch (error) {
      logger.error('BMI get history error:', error);
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

      const latest = await this.bmiService.getLatestBMI(userId);

      res.json({
        success: true,
        data: latest,
        message: latest ? 'Latest BMI retrieved successfully' : 'No BMI records found'
      });
    } catch (error) {
      logger.error('BMI get latest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest BMI',
        code: 'BMI_LATEST_SERVER_ERROR'
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

      const stats = await this.bmiService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'BMI statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('BMI get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI stats',
        code: 'BMI_STATS_SERVER_ERROR'
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

      if (!recordId) {
        res.status(400).json({
          success: false,
          error: 'Record ID is required',
          code: 'RECORD_ID_REQUIRED'
        });
        return;
      }

      const deleted = await this.bmiService.deleteBMIRecord(recordId, userId);
      
      if (deleted) {
        logger.info(`BMI record deleted: ${recordId} by user ${userId}`);
        res.json({
          success: true,
          data: { deletedRecordId: recordId },
          message: 'BMI record deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'BMI record not found or access denied',
          code: 'BMI_RECORD_NOT_FOUND'
        });
      }
    } catch (error) {
      logger.error('BMI delete record error:', error);
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

      const deletedCount = await this.bmiService.clearUserHistory(userId);

      logger.info(`BMI history cleared: ${deletedCount} records for user ${userId}`);
      res.json({
        success: true,
        data: { 
          deletedCount,
          userId: userId
        },
        message: `Successfully cleared ${deletedCount} BMI records`
      });
    } catch (error) {
      logger.error('BMI clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_SERVER_ERROR'
      });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request = req.body as BMICalculationRequest;
      const validation = await this.bmiService.validateBMIData(request);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          input: request
        },
        message: validation.valid ? 'BMI data is valid' : 'BMI data validation failed'
      });
    } catch (error) {
      logger.error('BMI validate data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating BMI data',
        code: 'BMI_VALIDATE_SERVER_ERROR'
      });
    }
  };

  getTrend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const days = parseInt(req.query.days as string) || 30;
      const records = await this.bmiService.getUserBMIHistory(userId, Math.min(days, 100));
      
      let trend = 'stable';
      if (records.length >= 2) {
        const latest = records[0]?.bmi;
        const previous = records[1]?.bmi;
        
        if (latest && previous) {
          const difference = latest - previous;
          if (difference > 0.5) trend = 'increasing';
          else if (difference < -0.5) trend = 'decreasing';
        }
      }

      res.json({
        success: true,
        data: {
          trend,
          records: records.slice(0, 10),
          summary: {
            totalRecords: records.length,
            timeframe: `${days} days`,
            analysisDate: new Date()
          }
        },
        message: 'BMI trend analysis completed'
      });
    } catch (error) {
      logger.error('BMI trend analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while analyzing BMI trend',
        code: 'BMI_TREND_SERVER_ERROR'
      });
    }
  };
}

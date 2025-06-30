import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { TDEEService } from '../services/TDEEService';
import { TDEECalculationRequest } from '../types/tdee.types';
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

      const request = req.body as TDEECalculationRequest;
      
      // 驗證數據
      const validation = await this.tdeeService.validateTDEEData(request);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid TDEE data',
          code: 'TDEE_DATA_INVALID',
          details: validation.errors
        });
        return;
      }

      // 計算 TDEE
      const result = await this.tdeeService.calculateTDEE(request);
      
      // 保存記錄
      const record = await this.tdeeService.saveTDEERecord(userId, request, result);

      logger.info(`TDEE calculated for user ${userId}`, { 
        bmr: result.bmr, 
        tdee: result.tdee,
        activityLevel: request.activity_level,
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
        message: 'TDEE calculated and saved successfully'
      });

    } catch (error) {
      logger.error('TDEE calculation error:', error);
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
      const history = await this.tdeeService.getUserTDEEHistory(userId, limit);

      res.json({
        success: true,
        data: {
          records: history,
          total: history.length,
          limit: limit
        },
        message: 'TDEE history retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get history error:', error);
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

      const latest = await this.tdeeService.getLatestTDEE(userId);

      res.json({
        success: true,
        data: latest,
        message: latest ? 'Latest TDEE retrieved successfully' : 'No TDEE records found'
      });
    } catch (error) {
      logger.error('TDEE get latest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest TDEE',
        code: 'TDEE_LATEST_SERVER_ERROR'
      });
    }
  };

  getActivityLevels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const levels = this.tdeeService.getActivityLevels();

      res.json({
        success: true,
        data: levels,
        message: 'Activity levels retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get activity levels error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting activity levels',
        code: 'TDEE_ACTIVITY_LEVELS_SERVER_ERROR'
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

      const stats = await this.tdeeService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'TDEE statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE stats',
        code: 'TDEE_STATS_SERVER_ERROR'
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

      const deleted = await this.tdeeService.deleteTDEERecord(recordId, userId);
      
      if (deleted) {
        logger.info(`TDEE record deleted: ${recordId} by user ${userId}`);
        res.json({
          success: true,
          data: { deletedRecordId: recordId },
          message: 'TDEE record deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'TDEE record not found or access denied',
          code: 'TDEE_RECORD_NOT_FOUND'
        });
      }
    } catch (error) {
      logger.error('TDEE delete record error:', error);
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

      const deletedCount = await this.tdeeService.clearUserHistory(userId);

      logger.info(`TDEE history cleared: ${deletedCount} records for user ${userId}`);
      res.json({
        success: true,
        data: { 
          deletedCount,
          userId: userId
        },
        message: `Successfully cleared ${deletedCount} TDEE records`
      });
    } catch (error) {
      logger.error('TDEE clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing TDEE history',
        code: 'TDEE_CLEAR_SERVER_ERROR'
      });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request = req.body as TDEECalculationRequest;
      const validation = await this.tdeeService.validateTDEEData(request);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          input: request
        },
        message: validation.valid ? 'TDEE data is valid' : 'TDEE data validation failed'
      });
    } catch (error) {
      logger.error('TDEE validate data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating TDEE data',
        code: 'TDEE_VALIDATE_SERVER_ERROR'
      });
    }
  };

  // 額外的營養建議端點
  getNutritionAdvice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const latest = await this.tdeeService.getLatestTDEE(userId);
      if (!latest) {
        res.status(404).json({
          success: false,
          error: 'No TDEE calculation found. Please calculate TDEE first.',
          code: 'NO_TDEE_RECORD'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          macronutrients: latest.macronutrients,
          calorieGoals: latest.calorie_goals,
          nutritionAdvice: latest.nutrition_advice,
          recommendations: latest.recommendations,
          basedOn: {
            tdee: latest.tdee,
            bmr: latest.bmr,
            activityLevel: latest.activity_level,
            calculatedAt: latest.created_at
          }
        },
        message: 'Nutrition advice retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE nutrition advice error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting nutrition advice',
        code: 'TDEE_NUTRITION_SERVER_ERROR'
      });
    }
  };
}

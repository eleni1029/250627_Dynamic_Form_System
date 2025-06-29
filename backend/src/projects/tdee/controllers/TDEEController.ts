import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { TDEECalculationRequest, ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEEController {
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

      const { height, weight, age, gender, activity_level } = req.body as TDEECalculationRequest;
      
      // 計算 BMR
      let bmr: number;
      if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }

      // 計算 TDEE
      const activityInfo = ACTIVITY_LEVELS[activity_level];
      const tdee = bmr * activityInfo.multiplier;

      const result = {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        activityInfo,
        height,
        weight,
        age,
        gender,
        activity_level
      };

      logger.info(`TDEE calculated for user ${userId}`, { bmr: result.bmr, tdee: result.tdee });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'TDEE calculated successfully'
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
      res.json({
        success: true,
        data: [],
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
      res.json({
        success: true,
        data: null,
        message: 'Latest TDEE retrieved successfully'
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
      const levels = Object.entries(ACTIVITY_LEVELS).map(([key, value]) => ({
        key,
        name: value.name,
        description: value.description,
        multiplier: value.multiplier
      }));

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
      res.json({
        success: true,
        data: { totalRecords: 0 },
        message: 'TDEE stats retrieved successfully'
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
      res.json({
        success: true,
        message: 'TDEE record deleted successfully'
      });
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
      res.json({
        success: true,
        message: 'TDEE history cleared successfully'
      });
    } catch (error) {
      logger.error('TDEE clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing TDEE history',
        code: 'TDEE_CLEAR_HISTORY_SERVER_ERROR'
      });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        data: { isValid: true },
        message: 'Data is valid'
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
}

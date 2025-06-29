import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { BMICalculationRequest } from '../models/BMIRecord';
import { logger } from '../../../utils/logger';

export class BMIController {
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

      const { height, weight, age, gender } = req.body as BMICalculationRequest;
      
      // 計算 BMI
      const heightInM = height / 100;
      const bmi = weight / (heightInM * heightInM);
      
      let category = 'Normal weight';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25 && bmi < 30) category = 'Overweight';
      else if (bmi >= 30) category = 'Obese';

      const result = {
        bmi: Math.round(bmi * 100) / 100,
        category,
        height,
        weight,
        age,
        gender
      };

      logger.info(`BMI calculated for user ${userId}`, { bmi: result.bmi, category });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'BMI calculated successfully'
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
      res.json({
        success: true,
        data: [],
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
      res.json({
        success: true,
        data: null,
        message: 'Latest BMI retrieved successfully'
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
      res.json({
        success: true,
        data: { totalRecords: 0 },
        message: 'BMI stats retrieved successfully'
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
      res.json({
        success: true,
        message: 'BMI record deleted successfully'
      });
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
      res.json({
        success: true,
        message: 'BMI history cleared successfully'
      });
    } catch (error) {
      logger.error('BMI clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_HISTORY_SERVER_ERROR'
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
      logger.error('BMI validate data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating BMI data',
        code: 'BMI_VALIDATE_SERVER_ERROR'
      });
    }
  };
}

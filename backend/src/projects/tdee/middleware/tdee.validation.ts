// ===== 檔案 9: backend/src/projects/tdee/middleware/tdee.validation.ts =====

import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

// TDEE 計算專用驗證中間件
export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level } = req.body;

    // 檢查必要欄位
    if (!height || !weight || !age || !gender || !activity_level) {
      res.status(400).json({
        success: false,
        error: 'All fields are required for TDEE calculation: height, weight, age, gender, activity_level',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = parseInt(age);

    if (isNaN(numHeight) || isNaN(numWeight) || isNaN(numAge)) {
      res.status(400).json({
        success: false,
        error: 'Height, weight, and age must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 身高範圍驗證 (50-300cm)
    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    // 體重範圍驗證 (10-500kg)
    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    // 年齡範圍驗證 (1-150歲)
    if (numAge < 1 || numAge > 150) {
      res.status(400).json({
        success: false,
        error: 'Age must be between 1-150 years',
        code: 'INVALID_AGE_RANGE'
      });
      return;
    }

    // 性別驗證 (TDEE 必須指定性別)
    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be either male or female',
        code: 'INVALID_GENDER'
      });
      return;
    }

    // 活動等級驗證
    if (!ACTIVITY_LEVELS[activity_level as keyof typeof ACTIVITY_LEVELS]) {
      const validLevels = Object.keys(ACTIVITY_LEVELS).join(', ');
      res.status(400).json({
        success: false,
        error: `Activity level must be one of: ${validLevels}`,
        code: 'INVALID_ACTIVITY_LEVEL'
      });
      return;
    }

    // 將驗證後的數值存回 req.body
    req.body.height = numHeight;
    req.body.weight = numWeight;
    req.body.age = numAge;

    next();

  } catch (error) {
    logger.error('TDEE validation error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE validation processing error',
      code: 'TDEE_VALIDATION_ERROR'
    });
  }
};
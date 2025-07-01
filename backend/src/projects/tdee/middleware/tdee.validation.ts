import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS, validateTDEEInput } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level, bmr_formula, body_fat_percentage } = req.body;

    // 必填字段檢查
    const requiredFields = ['height', 'weight', 'age', 'gender', 'activity_level'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'TDEE_MISSING_REQUIRED_FIELDS',
        details: { missingFields }
      });
      return;
    }

    // 數據類型轉換
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = parseInt(age);
    const numBodyFat = body_fat_percentage ? parseFloat(body_fat_percentage) : undefined;

    // 數據格式驗證
    if (isNaN(numHeight) || isNaN(numWeight) || isNaN(numAge)) {
      res.status(400).json({
        success: false,
        error: 'Height, weight, and age must be valid numbers',
        code: 'TDEE_INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 範圍驗證
    const errors: string[] = [];
    
    if (numHeight < 50 || numHeight > 300) {
      errors.push('身高必須在 50-300cm 之間');
    }
    
    if (numWeight < 10 || numWeight > 500) {
      errors.push('體重必須在 10-500kg 之間');
    }
    
    if (numAge < 1 || numAge > 150) {
      errors.push('年齡必須在 1-150 歲之間');
    }

    if (numBodyFat !== undefined && (numBodyFat < 5 || numBodyFat > 50)) {
      errors.push('體脂率必須在 5-50% 之間');
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'TDEE data validation failed',
        code: 'TDEE_VALIDATION_FAILED',
        details: errors
      });
      return;
    }

    // 性別驗證
    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be either male or female',
        code: 'TDEE_INVALID_GENDER'
      });
      return;
    }

    // 活動等級驗證
    if (!ACTIVITY_LEVELS[activity_level as keyof typeof ACTIVITY_LEVELS]) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity level',
        code: 'TDEE_INVALID_ACTIVITY_LEVEL',
        details: {
          provided: activity_level,
          valid_options: Object.keys(ACTIVITY_LEVELS)
        }
      });
      return;
    }

    // BMR 公式驗證
    const validFormulas = ['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle'];
    if (bmr_formula && !validFormulas.includes(bmr_formula)) {
      res.status(400).json({
        success: false,
        error: 'Invalid BMR formula',
        code: 'TDEE_INVALID_BMR_FORMULA',
        details: {
          provided: bmr_formula,
          valid_options: validFormulas
        }
      });
      return;
    }

    // Katch-McArdle 公式需要體脂率
    if (bmr_formula === 'katch_mcardle' && numBodyFat === undefined) {
      res.status(400).json({
        success: false,
        error: 'Body fat percentage is required for Katch-McArdle formula',
        code: 'TDEE_BODY_FAT_REQUIRED'
      });
      return;
    }

    // 設置處理過的數據
    req.body = {
      height: numHeight,
      weight: numWeight,
      age: numAge,
      gender,
      activity_level,
      bmr_formula: bmr_formula || 'mifflin_st_jeor',
      body_fat_percentage: numBodyFat
    };

    next();

  } catch (error) {
    logger.error('TDEE validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE validation processing error',
      code: 'TDEE_VALIDATION_ERROR'
    });
  }
};

export const validateTDEERecordAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const recordId = req.params.id;
    
    if (!recordId) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID is required',
        code: 'TDEE_RECORD_ID_REQUIRED'
      });
      return;
    }

    if (typeof recordId !== 'string' || recordId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID must be a valid string',
        code: 'TDEE_INVALID_RECORD_ID'
      });
      return;
    }

    // UUID 格式驗證
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID must be a valid UUID',
        code: 'TDEE_INVALID_UUID_FORMAT'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('TDEE record access validation error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE record access validation error',
      code: 'TDEE_RECORD_ACCESS_ERROR'
    });
  }
};

export const validateActivityLevel = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { activity_level } = req.body;
    
    if (!activity_level) {
      res.status(400).json({
        success: false,
        error: 'Activity level is required',
        code: 'ACTIVITY_LEVEL_REQUIRED'
      });
      return;
    }

    if (!ACTIVITY_LEVELS[activity_level as keyof typeof ACTIVITY_LEVELS]) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity level',
        code: 'INVALID_ACTIVITY_LEVEL',
        details: {
          provided: activity_level,
          valid_options: Object.keys(ACTIVITY_LEVELS)
        }
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('Activity level validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Activity level validation error',
      code: 'ACTIVITY_LEVEL_VALIDATION_ERROR'
    });
  }
};

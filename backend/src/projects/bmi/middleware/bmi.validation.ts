import { Request, Response, NextFunction } from 'express';
import { validateBMIInput } from '../types/bmi.types';
import { logger } from '../../../utils/logger';

export const validateBMICalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    // 基本必填字段檢查
    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required for BMI calculation',
        code: 'BMI_MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數據類型轉換
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = age ? parseInt(age) : undefined;

    // 數據格式驗證
    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'BMI_INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 使用統一的驗證函數
    const validation = validateBMIInput(numHeight, numWeight, numAge);
    
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'BMI data validation failed',
        code: 'BMI_VALIDATION_FAILED',
        details: validation.errors
      });
      return;
    }

    // 性別驗證
    if (gender && !['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be male or female',
        code: 'BMI_INVALID_GENDER'
      });
      return;
    }

    // 設置處理過的數據
    req.body = {
      height: numHeight,
      weight: numWeight,
      age: numAge,
      gender: gender || undefined
    };

    // 添加警告到響應中（如果有）
    if (validation.warnings && validation.warnings.length > 0) {
      (req.body as any)._warnings = validation.warnings;
    }

    next();

  } catch (error) {
    logger.error('BMI validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'BMI validation processing error',
      code: 'BMI_VALIDATION_ERROR'
    });
  }
};

export const validateBMIRecordAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const recordId = req.params.id;
    
    if (!recordId) {
      res.status(400).json({
        success: false,
        error: 'BMI record ID is required',
        code: 'BMI_RECORD_ID_REQUIRED'
      });
      return;
    }

    if (typeof recordId !== 'string' || recordId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'BMI record ID must be a valid string',
        code: 'BMI_INVALID_RECORD_ID'
      });
      return;
    }

    // UUID 格式驗證 (可選)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      res.status(400).json({
        success: false,
        error: 'BMI record ID must be a valid UUID',
        code: 'BMI_INVALID_UUID_FORMAT'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('BMI record access validation error:', error);
    res.status(500).json({
      success: false,
      error: 'BMI record access validation error',
      code: 'BMI_RECORD_ACCESS_ERROR'
    });
  }
};

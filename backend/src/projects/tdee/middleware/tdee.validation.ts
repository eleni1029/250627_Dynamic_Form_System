import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level } = req.body;

    if (!height || !weight || !age || !gender || !activity_level) {
      res.status(400).json({
        success: false,
        error: 'All fields are required for TDEE calculation',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

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

    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be either male or female',
        code: 'INVALID_GENDER'
      });
      return;
    }

    if (!ACTIVITY_LEVELS[activity_level as keyof typeof ACTIVITY_LEVELS]) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity level',
        code: 'INVALID_ACTIVITY_LEVEL'
      });
      return;
    }

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

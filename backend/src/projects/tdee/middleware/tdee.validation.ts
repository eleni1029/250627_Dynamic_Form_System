import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ACTIVITY_LEVELS } from '../types/tdee.types';

export const validateTDEECalculation = [
  body('height')
    .isNumeric()
    .withMessage('身高必須是數字')
    .isFloat({ min: 50, max: 250 })
    .withMessage('身高範圍應在 50-250cm 之間'),
    
  body('weight')
    .isNumeric()
    .withMessage('體重必須是數字')
    .isFloat({ min: 20, max: 300 })
    .withMessage('體重範圍應在 20-300kg 之間'),
    
  body('age')
    .isInt({ min: 1, max: 120 })
    .withMessage('年齡範圍應在 1-120 歲之間'),
    
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('性別必須是 male 或 female'),
    
  body('activity_level')
    .isIn(Object.keys(ACTIVITY_LEVELS))
    .withMessage(`活動等級必須是: ${Object.keys(ACTIVITY_LEVELS).join(', ')}`),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  }
];
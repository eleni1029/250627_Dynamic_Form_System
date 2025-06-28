#!/bin/bash
echo "🔧 Part 3: 中間件修復"

# 驗證中間件
mkdir -p ../backend/src/middleware
cat > ../backend/src/middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required for BMI calculation',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = age ? parseInt(age) : undefined;

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    if (numAge !== undefined && (isNaN(numAge) || numAge < 1 || numAge > 150)) {
      res.status(400).json({
        success: false,
        error: 'Age must be between 1-150 years',
        code: 'INVALID_AGE_RANGE'
      });
      return;
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be male, female, or other',
        code: 'INVALID_GENDER'
      });
      return;
    }

    req.body.height = numHeight;
    req.body.weight = numWeight;
    if (numAge !== undefined) {
      req.body.age = numAge;
    }

    next();

  } catch (error) {
    logger.error('Body metrics validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Body metrics validation processing error',
      code: 'BODY_METRICS_VALIDATION_ERROR'
    });
  }
};

export const validateIdParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: `${paramName} parameter is required`,
          code: 'MISSING_ID_PARAMETER'
        });
        return;
      }

      if (typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: `${paramName} must be a non-empty string`,
          code: 'INVALID_ID_FORMAT'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('ID param validation error:', error);
      res.status(500).json({
        success: false,
        error: 'ID parameter validation processing error',
        code: 'ID_PARAM_VALIDATION_ERROR'
      });
    }
  };
};
EOF

# 認證中間件
cat > ../backend/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { SessionUser } from '../types/auth.types';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session?.user) {
      req.user = req.session.user;
      req.isAdmin = false;
      
      logger.debug('User authenticated', {
        userId: req.user.id,
        username: req.user.username,
        path: req.path
      });
      
      return next();
    }

    if (req.session?.isAdmin) {
      req.isAdmin = true;
      
      logger.debug('Admin authenticated', {
        path: req.path,
        adminUser: req.session.adminUser
      });
      
      return next();
    }

    logger.warn('Authentication required', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};
EOF

echo "✅ Part 3 完成: 中間件已修復"

#!/bin/bash

# ===== 修復腳本 Part 2 =====
echo "🚀 執行修復腳本 Part 2 - 中間件與驗證..."

# 5. 修復 validation middleware
echo "📝 修復驗證中間件..."
cat > backend/src/middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }));

      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation processing error',
      code: 'VALIDATION_PROCESSING_ERROR'
    });
  }
};

const validateNumberRange = (value: number, min: number, max: number, fieldName: string): { isValid: boolean; message: string } => {
  if (isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (value < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (value > max) {
    return { isValid: false, message: `${fieldName} must not exceed ${max}` };
  }
  
  return { isValid: true, message: '' };
};

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

    const heightValidation = validateNumberRange(numHeight, 50, 300, 'Height');
    if (!heightValidation.isValid) {
      res.status(400).json({
        success: false,
        error: heightValidation.message,
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    const weightValidation = validateNumberRange(numWeight, 10, 500, 'Weight');
    if (!weightValidation.isValid) {
      res.status(400).json({
        success: false,
        error: weightValidation.message,
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    if (numAge !== undefined) {
      const ageValidation = validateNumberRange(numAge, 1, 150, 'Age');
      if (!ageValidation.isValid) {
        res.status(400).json({
          success: false,
          error: ageValidation.message,
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }
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

export const validatePaginationParams = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page, limit } = req.query;
    
    let numPage = 1;
    let numLimit = 20;

    if (page) {
      numPage = parseInt(page as string);
      if (isNaN(numPage) || numPage < 1) {
        res.status(400).json({
          success: false,
          error: 'Page must be a positive integer',
          code: 'INVALID_PAGE_PARAMETER'
        });
        return;
      }
    }

    if (limit) {
      numLimit = parseInt(limit as string);
      if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT_PARAMETER'
        });
        return;
      }
    }

    req.query.page = numPage.toString();
    req.query.limit = numLimit.toString();

    next();
  } catch (error) {
    logger.error('Pagination validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Pagination validation processing error',
      code: 'PAGINATION_VALIDATION_ERROR'
    });
  }
};
EOF

# 6. 修復 auth.types.ts
echo "📝 修復認證類型檔案..."
cat > backend/src/types/auth.types.ts << 'EOF'
import { Request } from 'express';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  last_login_at?: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: SessionUser;
  token?: string;
  expiresAt?: Date;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user?: SessionUser;
  session?: {
    id: string;
    expiresAt: Date;
    lastActivity: Date;
  };
}

export interface SessionConfig {
  secret: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: boolean | 'none' | 'lax' | 'strict';
}

export interface PermissionCheck {
  hasPermission: boolean;
  projectId?: string;
  projectKey?: string;
  userId: string;
  permissionType: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
  url?: string;
}
EOF

# 7. 創建 TDEE 驗證中間件
echo "📝 創建 TDEE 驗證中間件..."
mkdir -p backend/src/projects/tdee/middleware
cat > backend/src/projects/tdee/middleware/tdee.validation.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level } = req.body;

    if (!height || !weight || !age || !gender || !activity_level) {
      res.status(400).json({
        success: false,
        error: 'All fields are required for TDEE calculation: height, weight, age, gender, activity_level',
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

    if (numAge < 1 || numAge > 150) {
      res.status(400).json({
        success: false,
        error: 'Age must be between 1-150 years',
        code: 'INVALID_AGE_RANGE'
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
      const validLevels = Object.keys(ACTIVITY_LEVELS).join(', ');
      res.status(400).json({
        success: false,
        error: `Activity level must be one of: ${validLevels}`,
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
EOF

# 8. 創建 TDEE 類型檔案
echo "📝 創建 TDEE 類型檔案..."
mkdir -p backend/src/projects/tdee/types
cat > backend/src/projects/tdee/types/tdee.types.ts << 'EOF'
export const ACTIVITY_LEVELS = {
  sedentary: {
    multiplier: 1.2,
    description: 'Little or no exercise',
    name: 'Sedentary'
  },
  light: {
    multiplier: 1.375,
    description: 'Light exercise/sports 1-3 days/week',
    name: 'Lightly Active'
  },
  moderate: {
    multiplier: 1.55,
    description: 'Moderate exercise/sports 3-5 days/week',
    name: 'Moderately Active'
  },
  active: {
    multiplier: 1.725,
    description: 'Hard exercise/sports 6-7 days a week',
    name: 'Very Active'
  },
  very_active: {
    multiplier: 1.9,
    description: 'Very hard exercise/sports & physical job or training twice a day',
    name: 'Extra Active'
  }
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;
export type Gender = 'male' | 'female';

export interface TDEECalculationData {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: ActivityLevel;
    multiplier: number;
    description: string;
    name: string;
  };
}

export interface TDEEStatsResponse {
  totalRecords: number;
  averageTDEE: number;
  averageBMR: number;
  mostUsedActivityLevel: string;
  activityLevelBreakdown: Array<{
    activity_level: string;
    count: number;
    percentage: number;
  }>;
}
EOF

echo "✅ 修復腳本 Part 2 完成!"
echo "📝 已修復："
echo "   - 驗證中間件"
echo "   - 認證類型檔案" 
echo "   - TDEE 驗證中間件"
echo "   - TDEE 類型定義"
echo ""
echo "🔄 請執行 Part 3 修復腳本..."
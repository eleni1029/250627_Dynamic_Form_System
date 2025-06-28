#!/bin/bash

# ===== 修復腳本 Part 2 =====
echo "🚀 執行修復腳本 Part 2..."

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
    return { isValid: false, message: \`\${fieldName} must be a valid number\` };
  }
  
  if (value < min) {
    return { isValid: false, message: \`\${fieldName} must be at least \${min}\` };
  }
  
  if (value > max) {
    return { isValid: false, message: \`\${fieldName} must not exceed \${max}\` };
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

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

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
      if (isNaN(numAge)) {
        res.status(400).json({
          success: false,
          error: 'Age must be a valid number',
          code: 'INVALID_AGE_FORMAT'
        });
        return;
      }

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

export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];

      if (!id) {
        res.status(400).json({
          success: false,
          error: \`\${paramName} parameter is required\`,
          code: 'MISSING_ID_PARAMETER'
        });
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: \`Invalid \${paramName} format\`,
          code: 'INVALID_ID_FORMAT'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error(\`ID validation error for \${paramName}:\`, error);
      res.status(500).json({
        success: false,
        error: 'ID validation processing error',
        code: 'ID_VALIDATION_ERROR'
      });
    }
  };
};

export const isValidImageFile = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim();
};
EOF

# 6. 修復 auth.types.ts
echo "📝 修復認證類型檔案..."
cat > backend/src/types/auth.types.ts << 'EOF'
export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: SessionUser;
  message?: string;
  error?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    isAdmin?: boolean;
    adminLastActivity?: number;
    adminUser?: {
      username: string;
      loginTime?: Date;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
    }
  }
}

export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  is_active?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserPermission {
  id: string;
  user_id: string;
  project_id: string;
  granted_at: Date;
  granted_by: string;
}

export interface UserWithPermissions extends User {
  permissions: {
    project_key: string;
    project_name: string;
    granted_at: Date;
  }[];
}

export interface Project {
  id: string;
  project_key: string;
  project_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action_type: string;
  action_description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateActivityLogRequest {
  user_id?: string;
  action_type: string;
  action_description?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityLogListResponse {
  logs: (ActivityLog & { username?: string })[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectPermission {
  user_id: string;
  project_id: string;
  username: string;
  user_name: string;
  project_key: string;
  project_name: string;
  granted_at: Date;
  granted_by: string;
}

export interface GrantPermissionRequest {
  user_id: string;
  project_id: string;
}

export interface RevokePermissionRequest {
  user_id: string;
  project_id: string;
}

export interface FileUploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  message?: string;
  error?: string;
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
        error: \`Activity level must be one of: \${validLevels}\`,
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

echo "✅ 修復腳本 Part 2 完成!"
echo "📝 已修復："
echo "   - 驗證中間件"
echo "   - 認證類型檔案" 
echo "   - TDEE 驗證中間件"
echo ""
echo "🔄 請執行 Part 3 修復腳本..."
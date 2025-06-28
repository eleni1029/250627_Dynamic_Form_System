// ===== 修復檔案 1: backend/src/types/auth.types.ts =====
// 修復類型定義問題，確保類型一致性

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

// SessionUser 與 User 保持一致
export interface SessionUser {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 認證相關接口
export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

// Express Session 擴展
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

// Express Request 全局擴展
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
    }
  }
}

// ===== 用戶管理類型 =====
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

// ===== 專案相關類型 =====
export interface Project {
  id: string;
  project_key: string;
  project_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

// ===== 活動記錄類型 =====
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

// ===== API 響應類型 =====
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

// ===== 權限管理類型 =====
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

// ===== 文件上傳類型 =====
export interface FileUploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  message?: string;
  error?: string;
}

// ===== 修復檔案 2: backend/src/middleware/validation.middleware.ts =====
// 完善驗證中間件，修復被截斷的問題

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

// 統一的驗證中間件
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

// 數值範圍驗證輔助函數
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

// 身體數據驗證（用於 BMI 計算）- 完整版
export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    // 檢查必要欄位 - height 和 weight 是必需的
    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required for BMI calculation',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
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

    // 身高範圍驗證 (50-300cm)
    const heightValidation = validateNumberRange(numHeight, 50, 300, 'Height');
    if (!heightValidation.isValid) {
      res.status(400).json({
        success: false,
        error: heightValidation.message,
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    // 體重範圍驗證 (10-500kg)
    const weightValidation = validateNumberRange(numWeight, 10, 500, 'Weight');
    if (!weightValidation.isValid) {
      res.status(400).json({
        success: false,
        error: weightValidation.message,
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    // 年齡驗證（可選）
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

    // 性別驗證（可選）
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be male, female, or other',
        code: 'INVALID_GENDER'
      });
      return;
    }

    // 將驗證後的數值存回 req.body
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

// 密碼強度驗證
const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { isValid: false, message: 'Password must not exceed 100 characters' };
  }

  return { isValid: true, message: '' };
};

// 檢查文件類型
export const isValidImageFile = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

// 清理和標準化輸入
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim();
};

// 通用數值驗證中間件
export const validateNumericField = (fieldName: string, min: number, max: number, required: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const value = req.body[fieldName];

      if (required && (value === undefined || value === null || value === '')) {
        res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
          code: 'MISSING_REQUIRED_FIELD'
        });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        const numValue = parseFloat(value);
        const validation = validateNumberRange(numValue, min, max, fieldName);
        
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: validation.message,
            code: 'INVALID_FIELD_VALUE'
          });
          return;
        }

        req.body[fieldName] = numValue;
      }

      next();

    } catch (error) {
      logger.error(`Validation error for field ${fieldName}:`, error);
      res.status(500).json({
        success: false,
        error: 'Field validation processing error',
        code: 'FIELD_VALIDATION_ERROR'
      });
    }
  };
};

// ID 參數驗證中間件
export const validateIdParam = (paramName: string = 'id') => {
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

      // 簡單的 UUID 格式驗證
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format`,
          code: 'INVALID_ID_FORMAT'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error(`ID validation error for ${paramName}:`, error);
      res.status(500).json({
        success: false,
        error: 'ID validation processing error',
        code: 'ID_VALIDATION_ERROR'
      });
    }
  };
};
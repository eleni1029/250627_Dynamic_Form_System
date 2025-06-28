// ===== 完整的驗證中間件 =====
// backend/src/middleware/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

// 統一的驗證中間件
export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // 格式化錯誤信息
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

// 身體數據驗證（用於 BMI 計算）- 增強版
export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    // 檢查必要欄位
    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // 數值類型驗證
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 身高範圍驗證 (國際標準: 50-300cm)
    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    // 體重範圍驗證 (國際標準: 10-500kg)
    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    // 年齡驗證 (可選欄位)
    if (age !== undefined) {
      const numAge = parseInt(age);
      if (isNaN(numAge) || numAge < 1 || numAge > 150) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }
    }

    // 性別驗證 (可選欄位)
    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(gender)) {
        res.status(400).json({
          success: false,
          error: 'Gender must be male, female, or other',
          code: 'INVALID_GENDER'
        });
        return;
      }
    }

    // 將驗證後的數值存回 req.body
    req.body.height = numHeight;
    req.body.weight = numWeight;
    if (age) req.body.age = parseInt(age);

    next();

  } catch (error) {
    logger.error('Body metrics validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation processing error',
      code: 'VALIDATION_ERROR'
    });
  }
};

// 自定義驗證函數

// 檢查是否為有效的 UUID
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// 檢查用戶名格式
export const isValidUsername = (username: string): boolean => {
  // 用戶名只能包含字母、數字、點、連字符和下劃線
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  return usernameRegex.test(username) && username.length >= 1 && username.length <= 50;
};

// 檢查專案 key 格式
export const isValidProjectKey = (projectKey: string): boolean => {
  // 專案 key 只能包含字母、數字、連字符和下劃線
  const projectKeyRegex = /^[a-zA-Z0-9_-]+$/;
  return projectKeyRegex.test(projectKey) && projectKey.length >= 1 && projectKey.length <= 50;
};

// 檢查密碼強度
export const isStrongPassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { isValid: false, message: 'Password must not exceed 100 characters' };
  }

  // 可以添加更多密碼強度檢查
  // 例如：必須包含大小寫字母、數字、特殊字符等
  
  return { isValid: true };
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
  
  // 移除前後空白
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

      // 基本 UUID 格式驗證
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
      logger.error(`ID validation error for param ${paramName}:`, error);
      res.status(500).json({
        success: false,
        error: 'ID validation processing error',
        code: 'ID_VALIDATION_ERROR'
      });
    }
  };
};

// 分頁參數驗證中間件
export const paginationValidation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = req.query.sort as string || 'created_at';
    const order = (req.query.order as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // 驗證分頁參數
    if (page < 1) {
      res.status(400).json({
        success: false,
        error: 'Page number must be greater than 0',
        code: 'INVALID_PAGE_NUMBER'
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT'
      });
      return;
    }

    // 將清理後的參數重新設置到 query 中
    req.query.page = page.toString();
    req.query.limit = limit.toString();
    req.query.sort = sanitizeInput(sort);
    req.query.order = order;

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

// 增強的分頁驗證（與上面的相容）
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // 驗證分頁參數範圍
    if (page < 1) {
      res.status(400).json({
        success: false,
        error: 'Page must be greater than 0',
        code: 'INVALID_PAGE_PARAMETER'
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT_PARAMETER'
      });
      return;
    }

    // 將驗證後的值設置回 query
    req.query.page = page.toString();
    req.query.limit = limit.toString();

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

// 日期範圍驗證中間件
export const dateRangeValidation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { startDate, endDate } = req.query;

    if (startDate && !Date.parse(startDate as string)) {
      res.status(400).json({
        success: false,
        error: 'Invalid start date format',
        code: 'INVALID_START_DATE'
      });
      return;
    }

    if (endDate && !Date.parse(endDate as string)) {
      res.status(400).json({
        success: false,
        error: 'Invalid end date format',
        code: 'INVALID_END_DATE'
      });
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (start > end) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
        return;
      }

      // 檢查日期範圍是否過大（例如不超過 1 年）
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 年毫秒數
      if (end.getTime() - start.getTime() > maxRange) {
        res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 1 year',
          code: 'DATE_RANGE_TOO_LARGE'
        });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Date range validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Date range validation processing error',
      code: 'DATE_RANGE_VALIDATION_ERROR'
    });
  }
};

// 匯出數值範圍驗證函數（保持相容性）
export { validateNumberRange };
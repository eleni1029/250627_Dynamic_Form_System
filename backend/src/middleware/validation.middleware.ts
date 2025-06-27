// backend/src/middleware/validation.middleware.ts - 驗證中間件
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

// 數值範圍驗證函數
export const validateNumberRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): { isValid: boolean; message?: string } => {
  if (isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (value < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (value > max) {
    return { isValid: false, message: `${fieldName} must not exceed ${max}` };
  }
  
  return { isValid: true };
};

// 身體數據驗證（用於 BMI/TDEE 計算）
export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age } = req.body;

    // 驗證身高（單位：cm，範圍：50-300）
    if (height !== undefined) {
      const heightValidation = validateNumberRange(height, 50, 300, 'Height');
      if (!heightValidation.isValid) {
        res.status(400).json({
          success: false,
          error: heightValidation.message,
          code: 'INVALID_HEIGHT'
        });
        return;
      }
    }

    // 驗證體重（單位：kg，範圍：10-500）
    if (weight !== undefined) {
      const weightValidation = validateNumberRange(weight, 10, 500, 'Weight');
      if (!weightValidation.isValid) {
        res.status(400).json({
          success: false,
          error: weightValidation.message,
          code: 'INVALID_WEIGHT'
        });
        return;
      }
    }

    // 驗證年齡（範圍：1-150）
    if (age !== undefined) {
      const ageValidation = validateNumberRange(age, 1, 150, 'Age');
      if (!ageValidation.isValid) {
        res.status(400).json({
          success: false,
          error: ageValidation.message,
          code: 'INVALID_AGE'
        });
        return;
      }
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
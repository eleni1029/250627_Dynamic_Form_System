import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 分頁參數驗證
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page, limit } = req.query;
    
    let numPage = 1;
    let numLimit = 50;

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
      error: 'Pagination validation error',
      code: 'PAGINATION_VALIDATION_ERROR'
    });
  }
};

// 日期範圍驗證
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { startDate, endDate } = req.query;
    
    if (startDate) {
      const start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Start date must be a valid date',
          code: 'INVALID_START_DATE'
        });
        return;
      }
      req.query.startDate = start.toISOString();
    }

    if (endDate) {
      const end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          error: 'End date must be a valid date',
          code: 'INVALID_END_DATE'
        });
        return;
      }
      req.query.endDate = end.toISOString();
    }

    if (startDate && endDate) {
      const start = new Date(req.query.startDate as string);
      const end = new Date(req.query.endDate as string);
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
        return;
      }

      // 檢查日期範圍不超過一年
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > oneYear) {
        res.status(400).json({
          success: false,
          error: 'Date range cannot exceed one year',
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
      error: 'Date range validation error',
      code: 'DATE_RANGE_VALIDATION_ERROR'
    });
  }
};

// 輸入清理中間件
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 清理字符串字段中的潛在危險字符
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 標籤
        .replace(/javascript:/gi, '') // 移除 javascript: 協議
        .replace(/on\w+\s*=/gi, '') // 移除事件處理器
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    // 清理 body 和 query 參數
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();

  } catch (error) {
    logger.error('Input sanitization error:', error);
    res.status(500).json({
      success: false,
      error: 'Input sanitization error',
      code: 'INPUT_SANITIZATION_ERROR'
    });
  }
};

// ID 參數驗證
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

      // UUID 格式驗證
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: `${paramName} must be a valid UUID`,
          code: 'INVALID_UUID_FORMAT'
        });
        return;
      }

      next();
      
    } catch (error) {
      logger.error(`${paramName} validation error:`, error);
      res.status(500).json({
        success: false,
        error: `${paramName} validation error`,
        code: 'ID_VALIDATION_ERROR'
      });
    }
  };
};

// 請求大小限制驗證
export const validateRequestSize = (maxSizeKB: number = 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const contentLength = req.get('content-length');
      
      if (contentLength) {
        const sizeInKB = parseInt(contentLength) / 1024;
        
        if (sizeInKB > maxSizeKB) {
          res.status(413).json({
            success: false,
            error: `Request size too large. Maximum allowed: ${maxSizeKB}KB`,
            code: 'REQUEST_TOO_LARGE'
          });
          return;
        }
      }

      next();

    } catch (error) {
      logger.error('Request size validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Request size validation error',
        code: 'REQUEST_SIZE_VALIDATION_ERROR'
      });
    }
  };
};

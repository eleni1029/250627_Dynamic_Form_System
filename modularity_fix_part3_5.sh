#!/bin/bash

echo "🔧 模組化修復 Part 3-5 - 驗證中間件與共享類型"
echo "============================================"

# ===== BMI 驗證中間件 =====
echo "📝 創建 BMI 驗證中間件..."

cat > backend/src/projects/bmi/middleware/bmi.validation.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { validateBMIInput } from '../types/bmi-utils.types';
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
      req.body._warnings = validation.warnings;
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
EOF

echo "✅ BMI 驗證中間件已創建"

# ===== TDEE 驗證中間件 =====
echo "📝 創建 TDEE 驗證中間件..."

cat > backend/src/projects/tdee/middleware/tdee.validation.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { ACTIVITY_LEVELS } from '../types/tdee-activity.types';
import { validateCalorieNeeds } from '../types/tdee-calculations.types';
import { logger } from '../../../utils/logger';

export const validateTDEECalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender, activity_level, bmr_formula, body_fat_percentage } = req.body;

    // 必填字段檢查
    const requiredFields = ['height', 'weight', 'age', 'gender', 'activity_level'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'TDEE_MISSING_REQUIRED_FIELDS',
        details: { missingFields }
      });
      return;
    }

    // 數據類型轉換
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = parseInt(age);
    const numBodyFat = body_fat_percentage ? parseFloat(body_fat_percentage) : undefined;

    // 數據格式驗證
    if (isNaN(numHeight) || isNaN(numWeight) || isNaN(numAge)) {
      res.status(400).json({
        success: false,
        error: 'Height, weight, and age must be valid numbers',
        code: 'TDEE_INVALID_NUMBER_FORMAT'
      });
      return;
    }

    // 範圍驗證
    const errors: string[] = [];
    
    if (numHeight < 50 || numHeight > 300) {
      errors.push('身高必須在 50-300cm 之間');
    }
    
    if (numWeight < 10 || numWeight > 500) {
      errors.push('體重必須在 10-500kg 之間');
    }
    
    if (numAge < 1 || numAge > 150) {
      errors.push('年齡必須在 1-150 歲之間');
    }

    if (numBodyFat !== undefined && (numBodyFat < 5 || numBodyFat > 50)) {
      errors.push('體脂率必須在 5-50% 之間');
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'TDEE data validation failed',
        code: 'TDEE_VALIDATION_FAILED',
        details: errors
      });
      return;
    }

    // 性別驗證
    if (!['male', 'female'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be either male or female',
        code: 'TDEE_INVALID_GENDER'
      });
      return;
    }

    // 活動等級驗證
    if (!ACTIVITY_LEVELS[activity_level]) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity level',
        code: 'TDEE_INVALID_ACTIVITY_LEVEL',
        details: {
          provided: activity_level,
          valid_options: Object.keys(ACTIVITY_LEVELS)
        }
      });
      return;
    }

    // BMR 公式驗證
    const validFormulas = ['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle'];
    if (bmr_formula && !validFormulas.includes(bmr_formula)) {
      res.status(400).json({
        success: false,
        error: 'Invalid BMR formula',
        code: 'TDEE_INVALID_BMR_FORMULA',
        details: {
          provided: bmr_formula,
          valid_options: validFormulas
        }
      });
      return;
    }

    // Katch-McArdle 公式需要體脂率
    if (bmr_formula === 'katch_mcardle' && numBodyFat === undefined) {
      res.status(400).json({
        success: false,
        error: 'Body fat percentage is required for Katch-McArdle formula',
        code: 'TDEE_BODY_FAT_REQUIRED'
      });
      return;
    }

    // 設置處理過的數據
    req.body = {
      height: numHeight,
      weight: numWeight,
      age: numAge,
      gender,
      activity_level,
      bmr_formula: bmr_formula || 'mifflin_st_jeor',
      body_fat_percentage: numBodyFat
    };

    next();

  } catch (error) {
    logger.error('TDEE validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE validation processing error',
      code: 'TDEE_VALIDATION_ERROR'
    });
  }
};

export const validateTDEERecordAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const recordId = req.params.id;
    
    if (!recordId) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID is required',
        code: 'TDEE_RECORD_ID_REQUIRED'
      });
      return;
    }

    if (typeof recordId !== 'string' || recordId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID must be a valid string',
        code: 'TDEE_INVALID_RECORD_ID'
      });
      return;
    }

    // UUID 格式驗證
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      res.status(400).json({
        success: false,
        error: 'TDEE record ID must be a valid UUID',
        code: 'TDEE_INVALID_UUID_FORMAT'
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('TDEE record access validation error:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE record access validation error',
      code: 'TDEE_RECORD_ACCESS_ERROR'
    });
  }
};

export const validateActivityLevel = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { activity_level } = req.body;
    
    if (!activity_level) {
      res.status(400).json({
        success: false,
        error: 'Activity level is required',
        code: 'ACTIVITY_LEVEL_REQUIRED'
      });
      return;
    }

    if (!ACTIVITY_LEVELS[activity_level]) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity level',
        code: 'INVALID_ACTIVITY_LEVEL',
        details: {
          provided: activity_level,
          valid_options: Object.keys(ACTIVITY_LEVELS)
        }
      });
      return;
    }

    next();

  } catch (error) {
    logger.error('Activity level validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Activity level validation error',
      code: 'ACTIVITY_LEVEL_VALIDATION_ERROR'
    });
  }
};
EOF

echo "✅ TDEE 驗證中間件已創建"

# ===== 共享驗證中間件 =====
echo "📝 創建共享驗證中間件..."

cat > backend/src/middleware/validation.middleware.ts << 'EOF'
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
EOF

echo "✅ 共享驗證中間件已創建"

# ===== 統一類型導出 =====
echo "📝 創建統一類型導出..."

cat > backend/src/projects/bmi/types/index.ts << 'EOF'
// BMI 模組統一類型導出
export * from './bmi-base.types';
export * from './bmi-classifications.types';
export * from './bmi-utils.types';
export * from './bmi-record.types';
EOF

cat > backend/src/projects/tdee/types/index.ts << 'EOF'
// TDEE 模組統一類型導出
export * from './tdee-base.types';
export * from './tdee-activity.types';
export * from './tdee-calculations.types';
export * from './tdee-nutrition.types';
EOF

echo "✅ 統一類型導出已創建"

echo "✅ Part 3-5 完成 - 驗證中間件與共享類型已建立"
echo ""
echo "🎉 完整的 Part 3 已完成！"
echo "========================"
echo ""
echo "📋 Part 3 完成內容總結："
echo "   ✅ Part 3-1: BMI 基礎類型與分類"
echo "   ✅ Part 3-2: BMI 功能函數與驗證" 
echo "   ✅ Part 3-3: TDEE 基礎類型與活動等級"
echo "   ✅ Part 3-4: TDEE 計算與營養類型"
echo "   ✅ Part 3-5: 驗證中間件與共享類型"
echo ""
echo "🔧 執行所有 Part 3 腳本："
echo "   bash modularity_fix_part3_1.sh"
echo "   bash modularity_fix_part3_2.sh"
echo "   bash modularity_fix_part3_3.sh"
echo "   bash modularity_fix_part3_4.sh"
echo "   bash modularity_fix_part3_5.sh"
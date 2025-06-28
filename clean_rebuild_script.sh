#!/bin/bash

echo "🧹 徹底清理並重建專案..."

# 1. 刪除所有有問題的檔案
echo "📝 清理損壞檔案..."
rm -rf backend/src/projects/bmi/controllers/
rm -rf backend/src/projects/bmi/routes/
rm -rf backend/src/projects/bmi/models/
rm -rf backend/src/projects/bmi/middleware/

rm -rf backend/src/projects/tdee/controllers/
rm -rf backend/src/projects/tdee/routes/
rm -rf backend/src/projects/tdee/models/
rm -rf backend/src/projects/tdee/middleware/

rm -f backend/src/middleware/validation.middleware.ts
rm -f backend/src/middleware/auth.middleware.ts
rm -f backend/src/types/auth.types.ts

# 2. 重建目錄結構
echo "📁 重建目錄結構..."
mkdir -p backend/src/projects/bmi/controllers
mkdir -p backend/src/projects/bmi/routes
mkdir -p backend/src/projects/bmi/models
mkdir -p backend/src/projects/bmi/middleware

mkdir -p backend/src/projects/tdee/controllers
mkdir -p backend/src/projects/tdee/routes
mkdir -p backend/src/projects/tdee/models
mkdir -p backend/src/projects/tdee/middleware

# 3. 重新創建正確的檔案
echo "📝 創建 auth.types.ts..."
cat > backend/src/types/auth.types.ts << 'EOF'
import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser extends User {}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    isAdmin?: boolean;
    adminUser?: { username: string; loginTime?: Date };
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
EOF

echo "📝 創建 auth.middleware.ts..."
cat > backend/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session?.user) {
      req.user = req.session.user;
      req.isAdmin = false;
      return next();
    }

    if (req.session?.isAdmin) {
      req.isAdmin = true;
      return next();
    }

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

echo "📝 創建 validation.middleware.ts..."
cat > backend/src/middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required',
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
      error: 'Validation processing error',
      code: 'VALIDATION_ERROR'
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
          error: `${paramName} parameter is required`,
          code: 'MISSING_ID_PARAMETER'
        });
        return;
      }
      next();
    } catch (error) {
      logger.error(`ID validation error:`, error);
      res.status(500).json({
        success: false,
        error: 'ID validation error',
        code: 'ID_VALIDATION_ERROR'
      });
    }
  };
};
EOF

echo "📝 創建 BMI 路由..."
cat > backend/src/projects/bmi/routes/bmi.routes.ts << 'EOF'
import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics, validateIdParam } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  const bmiController = new BMIController();

  router.use(authMiddleware);
  router.post('/calculate', validateBodyMetrics, bmiController.calculate);
  router.get('/history', bmiController.getHistory);
  router.get('/latest', bmiController.getLatest);
  router.get('/stats', bmiController.getUserStats);
  router.delete('/records/:id', validateIdParam('id'), bmiController.deleteRecord);
  router.delete('/history', bmiController.clearHistory);
  router.post('/validate', validateBodyMetrics, bmiController.validateData);

  return router;
};
EOF

echo "📝 創建 BMI 控制器..."
cat > backend/src/projects/bmi/controllers/BMIController.ts << 'EOF'
import { Response } from 'express';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest } from '../types/bmi.types';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { logger } from '../../../utils/logger';

export class BMIController {
  private bmiService: BMIService;

  constructor() {
    this.bmiService = new BMIService();
  }

  calculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const calculationData: BMICalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender
      };

      const result = await this.bmiService.calculate(userId, calculationData);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('BMI calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'BMI_CALCULATION_ERROR'
      });
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.bmiService.getHistory(userId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      logger.error('BMI history error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

  getLatest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const result = await this.bmiService.getLatestRecord(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('BMI latest error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

  deleteRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const recordId = req.params.id;
      const result = await this.bmiService.deleteRecord(userId, recordId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('BMI delete error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

  clearHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const result = await this.bmiService.clearHistory(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('BMI clear error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

  getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const result = await this.bmiService.getUserStats(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('BMI stats error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Auth required' });
        return;
      }

      const calculationData: BMICalculationRequest = {
        height: req.body.height,
        weight: req.body.weight,
        age: req.body.age,
        gender: req.body.gender
      };

      const validation = this.bmiService.validateCalculationData(calculationData);
      res.status(200).json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Data is valid' : 'Data validation failed'
      });
    } catch (error) {
      logger.error('BMI validate error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };
}
EOF

echo "📝 創建 BMI 模型..."
cat > backend/src/projects/bmi/models/BMIRecord.ts << 'EOF'
import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { BMIRecord, BMICalculationRequest } from '../types/bmi.types';
import { logger } from '../../../utils/logger';

export class BMIRecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(userId: string, data: BMICalculationRequest): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (user_id, height, weight, age, gender)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [userId, data.height, data.weight, data.age || null, data.gender || null];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  async getByUserId(userId: string, page: number = 1, limit: number = 10): Promise<BMIRecord[]> {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting BMI records:', error);
      throw new Error('Failed to get BMI records');
    }
  }

  async getLatestRecord(userId: string): Promise<BMIRecord | null> {
    try {
      const query = `SELECT * FROM bmi_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`;
      const result = await this.pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM bmi_records WHERE id = $1 AND user_id = $2 RETURNING id`;
      const result = await this.pool.query(query, [recordId, userId]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM bmi_records WHERE user_id = $1 RETURNING id`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error clearing BMI history:', error);
      throw new Error('Failed to clear BMI history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM bmi_records WHERE user_id = $1`;
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting BMI record count:', error);
      throw new Error('Failed to get BMI record count');
    }
  }

  async getAverageBMI(userId: string): Promise<number | null> {
    try {
      const query = `
        SELECT height, weight 
        FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) return null;

      const bmis = result.rows.map(row => {
        const heightInMeters = row.height / 100;
        return row.weight / (heightInMeters * heightInMeters);
      });

      return bmis.reduce((sum, bmi) => sum + bmi, 0) / bmis.length;
    } catch (error) {
      logger.error('Error getting average BMI:', error);
      throw new Error('Failed to get average BMI');
    }
  }
}
EOF

echo "✅ 清理重建完成！"
echo "🔄 現在測試編譯："
echo "cd backend && npm run build"
#!/bin/bash

# ===== Dynamic Form System 修復腳本 Part 1 =====
# 解決重複定義、缺失模組、路徑錯誤問題

echo "🚀 開始修復 Dynamic Form System - Part 1..."

# 1. 修復 BMI 路由檔案
echo "📝 修復 BMI 路由..."
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

# 2. 修復 TDEE 路由檔案
echo "📝 修復 TDEE 路由..."
cat > backend/src/projects/tdee/routes/tdee.routes.ts << 'EOF'
import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation } from '../middleware/tdee.validation';
import { validateIdParam } from '../../../middleware/validation.middleware';

export const createTDEERoutes = (): Router => {
  const router = Router();
  const tdeeController = new TDEEController();

  router.use(authMiddleware);
  router.post('/calculate', validateTDEECalculation, tdeeController.calculate);
  router.get('/history', tdeeController.getHistory);
  router.get('/latest', tdeeController.getLatest);
  router.get('/activity-levels', tdeeController.getActivityLevels);
  router.get('/stats', tdeeController.getUserStats);
  router.delete('/records/:id', validateIdParam('id'), tdeeController.deleteRecord);
  router.delete('/history', tdeeController.clearHistory);
  router.post('/validate', validateTDEECalculation, tdeeController.validateData);

  return router;
};
EOF

# 3. 修復 BMI Model
echo "📝 修復 BMI Model..."
cat > backend/src/projects/bmi/models/BMIRecord.ts << 'EOF'
import { Pool } from 'pg';
import { pool } from '../../../database/connection';
import { logger } from '../../../utils/logger';

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  age?: number;
  gender?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: string;
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  isHealthy: boolean;
}

export class BMIModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(userId: string, data: BMICalculationRequest & BMICalculationResult): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (user_id, height, weight, bmi, category, age, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        userId,
        data.height,
        data.weight,
        data.bmi,
        data.category,
        data.age || null,
        data.gender || null
      ];

      const result = await this.pool.query(query, values);
      logger.debug(`BMI record created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<BMIRecord[]> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await this.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding BMI records:', error);
      throw new Error('Failed to find BMI records');
    }
  }

  async findLatestByUserId(userId: string): Promise<BMIRecord | null> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
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
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM bmi_records WHERE user_id = $1 RETURNING id`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount;
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

  async getAverageStats(userId: string): Promise<{ avgBMI: number; avgWeight: number; avgHeight: number }> {
    try {
      const query = `
        SELECT 
          AVG(bmi) as avg_bmi,
          AVG(weight) as avg_weight,
          AVG(height) as avg_height
        FROM bmi_records 
        WHERE user_id = $1
      `;
      
      const result = await this.pool.query(query, [userId]);
      const row = result.rows[0];
      
      return {
        avgBMI: parseFloat(row.avg_bmi) || 0,
        avgWeight: parseFloat(row.avg_weight) || 0,
        avgHeight: parseFloat(row.avg_height) || 0
      };
    } catch (error) {
      logger.error('Error getting BMI average stats:', error);
      throw new Error('Failed to get BMI average stats');
    }
  }
}
EOF

# 4. 修復 TDEE Model
echo "📝 修復 TDEE Model..."
cat > backend/src/projects/tdee/models/TDEERecord.ts << 'EOF'
import { Pool } from 'pg';
import { pool } from '../../../database/connection';
import { logger } from '../../../utils/logger';

export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: string;
  activity_level: string;
  bmr: number;
  tdee: number;
  created_at: Date;
  updated_at: Date;
}

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: string;
  activity_level: string;
}

export interface TDEECalculationResult {
  bmr: number;
  tdee: number;
}

export class TDEEModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(userId: string, data: TDEECalculationRequest & TDEECalculationResult): Promise<TDEERecord> {
    try {
      const query = `
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, bmr, tdee)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        userId,
        data.height,
        data.weight,
        data.age,
        data.gender,
        data.activity_level,
        data.bmr,
        data.tdee
      ];

      const result = await this.pool.query(query, values);
      logger.debug(`TDEE record created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating TDEE record:', error);
      throw new Error('Failed to create TDEE record');
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<TDEERecord[]> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await this.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding TDEE records:', error);
      throw new Error('Failed to find TDEE records');
    }
  }

  async findLatestByUserId(userId: string): Promise<TDEERecord | null> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM tdee_records WHERE id = $1 AND user_id = $2 RETURNING id`;
      const result = await this.pool.query(query, [recordId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM tdee_records WHERE user_id = $1 RETURNING id`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error clearing TDEE history:', error);
      throw new Error('Failed to clear TDEE history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM tdee_records WHERE user_id = $1`;
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting TDEE record count:', error);
      throw new Error('Failed to get TDEE record count');
    }
  }

  async getRecordsByActivityLevel(userId: string): Promise<Array<{activity_level: string, count: number}>> {
    try {
      const query = `
        SELECT activity_level, COUNT(*) as count 
        FROM tdee_records 
        WHERE user_id = $1 
        GROUP BY activity_level 
        ORDER BY count DESC
      `;
      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => ({
        activity_level: row.activity_level,
        count: parseInt(row.count)
      }));
    } catch (error) {
      logger.error('Error getting TDEE records by activity level:', error);
      throw new Error('Failed to get TDEE records by activity level');
    }
  }
}
EOF

echo "✅ 修復腳本 Part 1 完成!"
echo "📝 已修復："
echo "   - BMI 路由檔案"
echo "   - TDEE 路由檔案"  
echo "   - BMI Model 模組"
echo "   - TDEE Model 模組"
echo ""
echo "🔄 請執行 Part 2 修復腳本..."
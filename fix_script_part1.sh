#!/bin/bash

# ===== Dynamic Form System 修復腳本 =====
# 解決重複定義、缺失模組、路徑錯誤問題

echo "🚀 開始修復 Dynamic Form System..."

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

# 3. 創建 BMI Model 模組
echo "📝 創建 BMI Model..."
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
      const query = \`
        INSERT INTO bmi_records (user_id, height, weight, age, gender)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      \`;

      const values = [userId, data.height, data.weight, data.age || null, data.gender || null];
      const result = await this.pool.query(query, values);
      logger.info(\`BMI record created for user \${userId}\`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  async getByUserId(userId: string, page: number = 1, limit: number = 10): Promise<BMIRecord[]> {
    try {
      const offset = (page - 1) * limit;
      const query = \`
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      \`;
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting BMI records:', error);
      throw new Error('Failed to get BMI records');
    }
  }

  async getLatestRecord(userId: string): Promise<BMIRecord | null> {
    try {
      const query = \`SELECT * FROM bmi_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1\`;
      const result = await this.pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = \`DELETE FROM bmi_records WHERE id = $1 AND user_id = $2 RETURNING id\`;
      const result = await this.pool.query(query, [recordId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = \`DELETE FROM bmi_records WHERE user_id = $1 RETURNING id\`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error clearing BMI history:', error);
      throw new Error('Failed to clear BMI history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = \`SELECT COUNT(*) as count FROM bmi_records WHERE user_id = $1\`;
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting BMI record count:', error);
      throw new Error('Failed to get BMI record count');
    }
  }

  async getAverageBMI(userId: string): Promise<number | null> {
    try {
      const query = \`
        SELECT height, weight 
        FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      \`;
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

# 4. 創建 TDEE Model 模組
echo "📝 創建 TDEE Model..."
cat > backend/src/projects/tdee/models/TDEERecord.ts << 'EOF'
import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { TDEERecord, TDEECalculationRequest } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEERecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(userId: string, data: TDEECalculationRequest): Promise<TDEERecord> {
    try {
      const query = \`
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      \`;

      const values = [userId, data.height, data.weight, data.age, data.gender, data.activity_level];
      const result = await this.pool.query(query, values);
      logger.info(\`TDEE record created for user \${userId}\`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating TDEE record:', error);
      throw new Error('Failed to create TDEE record');
    }
  }

  async getByUserId(userId: string, page: number = 1, limit: number = 10): Promise<TDEERecord[]> {
    try {
      const offset = (page - 1) * limit;
      const query = \`
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      \`;
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting TDEE records:', error);
      throw new Error('Failed to get TDEE records');
    }
  }

  async getLatestRecord(userId: string): Promise<TDEERecord | null> {
    try {
      const query = \`SELECT * FROM tdee_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1\`;
      const result = await this.pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = \`DELETE FROM tdee_records WHERE id = $1 AND user_id = $2 RETURNING id\`;
      const result = await this.pool.query(query, [recordId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = \`DELETE FROM tdee_records WHERE user_id = $1 RETURNING id\`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error clearing TDEE history:', error);
      throw new Error('Failed to clear TDEE history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = \`SELECT COUNT(*) as count FROM tdee_records WHERE user_id = $1\`;
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting TDEE record count:', error);
      throw new Error('Failed to get TDEE record count');
    }
  }

  async getRecordsByActivityLevel(userId: string): Promise<Array<{activity_level: string, count: number}>> {
    try {
      const query = \`
        SELECT activity_level, COUNT(*) as count 
        FROM tdee_records 
        WHERE user_id = $1 
        GROUP BY activity_level 
        ORDER BY count DESC
      \`;
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
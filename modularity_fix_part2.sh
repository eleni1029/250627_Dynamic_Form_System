#!/bin/bash

echo "🔧 模組化修復 Part 2 - 後端 Models 層"
echo "====================================="

# ===== BMI Model =====
echo "📝 創建 BMI Model..."

cat > backend/src/projects/bmi/models/BMIRecord.ts << 'EOF'
import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { logger } from '../../../utils/logger';

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  category_code: string;
  age?: number;
  gender?: string;
  is_healthy: boolean;
  who_classification: string;
  health_risks: string[];
  recommendations: string[];
  created_at: Date;
  updated_at: Date;
}

export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female';
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  categoryCode: string;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
}

export class BMIModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(userId: string, data: BMICalculationRequest & BMICalculationResult): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (
          user_id, height, weight, bmi, category, category_code, 
          age, gender, is_healthy, who_classification,
          health_risks, recommendations
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        userId,
        data.height,
        data.weight,
        data.bmi,
        data.category,
        data.categoryCode,
        data.age || null,
        data.gender || null,
        data.isHealthy,
        data.whoStandard,
        JSON.stringify(data.healthRisks),
        JSON.stringify(data.recommendations)
      ];

      const result = await this.pool.query(query, values);
      
      // 解析 JSON 字段
      const record = result.rows[0];
      record.health_risks = JSON.parse(record.health_risks);
      record.recommendations = JSON.parse(record.recommendations);
      
      logger.debug(`BMI record created for user ${userId}`);
      return record;
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
      
      // 解析 JSON 字段
      return result.rows.map(record => ({
        ...record,
        health_risks: JSON.parse(record.health_risks || '[]'),
        recommendations: JSON.parse(record.recommendations || '[]')
      }));
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
      
      if (result.rows.length === 0) return null;
      
      const record = result.rows[0];
      record.health_risks = JSON.parse(record.health_risks || '[]');
      record.recommendations = JSON.parse(record.recommendations || '[]');
      
      return record;
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

  async getAverageBMI(userId: string): Promise<number | null> {
    try {
      const query = `
        SELECT AVG(bmi) as average_bmi 
        FROM bmi_records 
        WHERE user_id = $1
      `;
      const result = await this.pool.query(query, [userId]);
      const avg = result.rows[0].average_bmi;
      return avg ? Math.round(avg * 100) / 100 : null;
    } catch (error) {
      logger.error('Error getting average BMI:', error);
      throw new Error('Failed to get average BMI');
    }
  }

  async getBMIRange(userId: string): Promise<{ min: number; max: number } | null> {
    try {
      const query = `
        SELECT MIN(bmi) as min_bmi, MAX(bmi) as max_bmi 
        FROM bmi_records 
        WHERE user_id = $1
      `;
      const result = await this.pool.query(query, [userId]);
      const row = result.rows[0];
      
      if (row.min_bmi === null || row.max_bmi === null) return null;
      
      return {
        min: Math.round(row.min_bmi * 100) / 100,
        max: Math.round(row.max_bmi * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting BMI range:', error);
      throw new Error('Failed to get BMI range');
    }
  }

  async getCategoryDistribution(userId: string): Promise<Record<string, number>> {
    try {
      const query = `
        SELECT category_code, COUNT(*) as count 
        FROM bmi_records 
        WHERE user_id = $1 
        GROUP BY category_code
      `;
      const result = await this.pool.query(query, [userId]);
      
      const distribution: Record<string, number> = {};
      result.rows.forEach(row => {
        distribution[row.category_code] = parseInt(row.count);
      });
      
      return distribution;
    } catch (error) {
      logger.error('Error getting category distribution:', error);
      throw new Error('Failed to get category distribution');
    }
  }
}
EOF

echo "✅ BMI Model 已創建"

# ===== TDEE Model =====
echo "📝 創建 TDEE Model..."

cat > backend/src/projects/tdee/models/TDEERecord.ts << 'EOF'
import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { logger } from '../../../utils/logger';

export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr: number;
  tdee: number;
  activity_multiplier: number;
  macronutrients: any;
  recommendations: any;
  calorie_goals: any;
  nutrition_advice: string[];
  created_at: Date;
  updated_at: Date;
}

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
}

export interface TDEECalculationResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
  };
  macronutrients?: any;
  recommendations?: any;
  calorieGoals?: any;
  nutritionAdvice?: string[];
}

export class TDEEModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async create(userId: string, data: TDEECalculationRequest & TDEECalculationResult): Promise<TDEERecord> {
    try {
      const query = `
        INSERT INTO tdee_records (
          user_id, height, weight, age, gender, activity_level,
          bmr, tdee, activity_multiplier, macronutrients,
          recommendations, calorie_goals, nutrition_advice
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        data.tdee,
        data.activityInfo.multiplier,
        JSON.stringify(data.macronutrients || {}),
        JSON.stringify(data.recommendations || {}),
        JSON.stringify(data.calorieGoals || {}),
        JSON.stringify(data.nutritionAdvice || [])
      ];

      const result = await this.pool.query(query, values);
      
      // 解析 JSON 字段
      const record = result.rows[0];
      record.macronutrients = JSON.parse(record.macronutrients || '{}');
      record.recommendations = JSON.parse(record.recommendations || '{}');
      record.calorie_goals = JSON.parse(record.calorie_goals || '{}');
      record.nutrition_advice = JSON.parse(record.nutrition_advice || '[]');
      
      logger.debug(`TDEE record created for user ${userId}`);
      return record;
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
      
      // 解析 JSON 字段
      return result.rows.map(record => ({
        ...record,
        macronutrients: JSON.parse(record.macronutrients || '{}'),
        recommendations: JSON.parse(record.recommendations || '{}'),
        calorie_goals: JSON.parse(record.calorie_goals || '{}'),
        nutrition_advice: JSON.parse(record.nutrition_advice || '[]')
      }));
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
      
      if (result.rows.length === 0) return null;
      
      const record = result.rows[0];
      record.macronutrients = JSON.parse(record.macronutrients || '{}');
      record.recommendations = JSON.parse(record.recommendations || '{}');
      record.calorie_goals = JSON.parse(record.calorie_goals || '{}');
      record.nutrition_advice = JSON.parse(record.nutrition_advice || '[]');
      
      return record;
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

  async getMostUsedActivityLevel(userId: string): Promise<string> {
    try {
      const query = `
        SELECT activity_level, COUNT(*) as count 
        FROM tdee_records 
        WHERE user_id = $1 
        GROUP BY activity_level 
        ORDER BY count DESC 
        LIMIT 1
      `;
      const result = await this.pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0].activity_level : 'moderate';
    } catch (error) {
      logger.error('Error getting most used activity level:', error);
      return 'moderate';
    }
  }

  async getAverageTDEE(userId: string): Promise<number | null> {
    try {
      const query = `
        SELECT AVG(tdee) as average_tdee 
        FROM tdee_records 
        WHERE user_id = $1
      `;
      const result = await this.pool.query(query, [userId]);
      const avg = result.rows[0].average_tdee;
      return avg ? Math.round(avg) : null;
    } catch (error) {
      logger.error('Error getting average TDEE:', error);
      throw new Error('Failed to get average TDEE');
    }
  }

  async getTDEERange(userId: string): Promise<{ min: number; max: number } | null> {
    try {
      const query = `
        SELECT MIN(tdee) as min_tdee, MAX(tdee) as max_tdee 
        FROM tdee_records 
        WHERE user_id = $1
      `;
      const result = await this.pool.query(query, [userId]);
      const row = result.rows[0];
      
      if (row.min_tdee === null || row.max_tdee === null) return null;
      
      return {
        min: Math.round(row.min_tdee),
        max: Math.round(row.max_tdee)
      };
    } catch (error) {
      logger.error('Error getting TDEE range:', error);
      throw new Error('Failed to get TDEE range');
    }
  }

  async getActivityLevelDistribution(userId: string): Promise<Record<string, number>> {
    try {
      const query = `
        SELECT activity_level, COUNT(*) as count 
        FROM tdee_records 
        WHERE user_id = $1 
        GROUP BY activity_level
      `;
      const result = await this.pool.query(query, [userId]);
      
      const distribution: Record<string, number> = {};
      result.rows.forEach(row => {
        distribution[row.activity_level] = parseInt(row.count);
      });
      
      return distribution;
    } catch (error) {
      logger.error('Error getting activity level distribution:', error);
      throw new Error('Failed to get activity level distribution');
    }
  }

  async getBMRTrend(userId: string, days: number = 30): Promise<Array<{ date: string; bmr: number }>> {
    try {
      const query = `
        SELECT DATE(created_at) as date, AVG(bmr) as avg_bmr
        FROM tdee_records 
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      const result = await this.pool.query(query, [userId]);
      
      return result.rows.map(row => ({
        date: row.date,
        bmr: Math.round(row.avg_bmr)
      }));
    } catch (error) {
      logger.error('Error getting BMR trend:', error);
      throw new Error('Failed to get BMR trend');
    }
  }

  async getTDEETrend(userId: string, days: number = 30): Promise<Array<{ date: string; tdee: number }>> {
    try {
      const query = `
        SELECT DATE(created_at) as date, AVG(tdee) as avg_tdee
        FROM tdee_records 
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      const result = await this.pool.query(query, [userId]);
      
      return result.rows.map(row => ({
        date: row.date,
        tdee: Math.round(row.avg_tdee)
      }));
    } catch (error) {
      logger.error('Error getting TDEE trend:', error);
      throw new Error('Failed to get TDEE trend');
    }
  }
}
EOF

echo "✅ TDEE Model 已創建"

# ===== 創建數據庫配置 =====
echo "📝 檢查並創建數據庫配置..."

if [ ! -f "backend/src/config/database.ts" ]; then
cat > backend/src/config/database.ts << 'EOF'
import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

const poolConfig: PoolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'dynamic_form_system',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });

    pool.on('connect', () => {
      logger.debug('Database connection established');
    });

    pool.on('acquire', () => {
      logger.debug('Database connection acquired from pool');
    });

    pool.on('release', () => {
      logger.debug('Database connection released back to pool');
    });
  }
  
  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const testPool = getPool();
    const client = await testPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
EOF

echo "✅ 數據庫配置已創建"
fi

echo "✅ Part 2 完成 - Models 層已建立"
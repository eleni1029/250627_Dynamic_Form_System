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

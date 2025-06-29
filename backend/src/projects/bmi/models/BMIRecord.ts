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
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM bmi_records WHERE user_id = $1 RETURNING id`;
      const result = await this.pool.query(query, [userId]);
      return result.rowCount ?? 0;
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
}

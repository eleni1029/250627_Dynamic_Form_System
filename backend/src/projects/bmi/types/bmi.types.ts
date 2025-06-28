// ===== 檔案 1: backend/src/projects/bmi/types/bmi.types.ts =====

export interface BMICalculationRequest {
  height: number;    // 身高 (cm, 50-300)
  weight: number;    // 體重 (kg, 10-500)
  age?: number;      // 年齡 (可選, 1-150)
  gender?: 'male' | 'female' | 'other'; // 性別 (可選)
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  category_en: string;
  isHealthy: boolean;
  recommendations: string[];
  healthRisk?: string;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age?: number;
  gender?: string;
  created_at: Date;
}

export interface BMIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface BMIHistoryQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// ===== 檔案 2: backend/src/projects/bmi/models/BMIRecord.ts =====

import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { BMIRecord, BMICalculationRequest } from '../types/bmi.types';
import { logger } from '../../../utils/logger';

export class BMIRecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 創建 BMI 記錄 - 僅保存用戶輸入值
  async create(userId: string, data: BMICalculationRequest): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (user_id, height, weight, age, gender)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        userId,
        data.height,
        data.weight,
        data.age || null,
        data.gender || null
      ];

      const result = await this.pool.query(query, values);
      
      logger.info(`BMI record created for user ${userId}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  // 按用戶 ID 獲取歷史記錄（分頁）
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
      logger.error('Error getting BMI records by user ID:', error);
      throw new Error('Failed to get BMI records');
    }
  }

  // 按 ID 獲取單筆記錄
  async getById(id: string, userId?: string): Promise<BMIRecord | null> {
    try {
      let query = 'SELECT * FROM bmi_records WHERE id = $1';
      const values: any[] = [id];

      if (userId) {
        query += ' AND user_id = $2';
        values.push(userId);
      }

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;

    } catch (error) {
      logger.error('Error getting BMI record by id:', error);
      throw new Error('Failed to get BMI record');
    }
  }

  // 刪除記錄
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM bmi_records WHERE id = $1 AND user_id = $2';
      const result = await this.pool.query(query, [id, userId]);
      
      const deleted = result.rowCount > 0;
      if (deleted) {
        logger.info(`BMI record ${id} deleted for user ${userId}`);
      }
      
      return deleted;

    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  // 獲取用戶最新的 BMI 記錄（用於表單預填）
  async getLatestRecord(userId: string): Promise<BMIRecord | null> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;

    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }

  // 清除用戶所有歷史記錄
  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = 'DELETE FROM bmi_records WHERE user_id = $1';
      const result = await this.pool.query(query, [userId]);
      
      const deletedCount = result.rowCount;
      logger.info(`Cleared ${deletedCount} BMI records for user ${userId}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('Error clearing BMI history:', error);
      throw new Error('Failed to clear BMI history');
    }
  }

  // 統計用戶記錄總數
  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM bmi_records WHERE user_id = $1';
      const result = await this.pool.query(query, [userId]);
      
      return parseInt(result.rows[0].count);

    } catch (error) {
      logger.error('Error getting BMI record count:', error);
      throw new Error('Failed to get BMI record count');
    }
  }
}
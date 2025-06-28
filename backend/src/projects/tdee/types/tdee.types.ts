// ===== 檔案 5: backend/src/projects/tdee/types/tdee.types.ts =====

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface TDEECalculationRequest {
  height: number;              // 身高 (cm, 50-300)
  weight: number;              // 體重 (kg, 10-500) 
  age: number;                 // 年齡 (1-150)
  gender: 'male' | 'female';   // 性別 (必填)
  activity_level: ActivityLevel; // 活動等級 (必填)
}

export interface TDEECalculationResult {
  bmr: number;                 // 基礎代謝率
  tdee: number;                // 總日消耗熱量
  bmi: number;                 // BMI 值
  bmi_category: string;        // BMI 分類
  activity_description: string; // 活動等級描述
  recommendations: {
    weight_loss: number;       // 減重建議熱量
    maintenance: number;       // 維持體重熱量  
    weight_gain: number;       // 增重建議熱量
  };
  health_notes: string[];      // 健康建議
}

export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: string;
  activity_level: string;
  created_at: Date;
}

export interface TDEEApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface TDEEHistoryQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// 活動等級定義
export const ACTIVITY_LEVELS = {
  sedentary: {
    key: 'sedentary',
    name: '久坐',
    name_en: 'Sedentary',
    description: '久坐生活方式，很少或沒有運動',
    description_en: 'Little or no exercise',
    multiplier: 1.2
  },
  light: {
    key: 'light', 
    name: '輕度活動',
    name_en: 'Light',
    description: '輕度活動，每週運動1-3天',
    description_en: 'Light exercise 1-3 days/week',
    multiplier: 1.375
  },
  moderate: {
    key: 'moderate',
    name: '中度活動', 
    name_en: 'Moderate',
    description: '中度活動，每週運動3-5天',
    description_en: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55
  },
  active: {
    key: 'active',
    name: '高度活動',
    name_en: 'Active', 
    description: '高度活動，每週運動6-7天',
    description_en: 'Heavy exercise 6-7 days/week',
    multiplier: 1.725
  },
  very_active: {
    key: 'very_active',
    name: '非常活躍',
    name_en: 'Very Active',
    description: '非常活躍，每天運動或體力勞動工作',
    description_en: 'Very heavy exercise or physical job',
    multiplier: 1.9
  }
} as const;

// ===== 檔案 6: backend/src/projects/tdee/models/TDEERecord.ts =====

import { Pool } from 'pg';
import { getPool } from '../../../config/database';
import { TDEERecord, TDEECalculationRequest } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEERecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 創建 TDEE 記錄 - 僅保存用戶輸入值
  async create(userId: string, data: TDEECalculationRequest): Promise<TDEERecord> {
    try {
      const query = `
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        userId,
        data.height,
        data.weight,
        data.age,
        data.gender,
        data.activity_level
      ];

      const result = await this.pool.query(query, values);
      
      logger.info(`TDEE record created for user ${userId}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Error creating TDEE record:', error);
      throw new Error('Failed to create TDEE record');
    }
  }

  // 按用戶 ID 獲取歷史記錄（分頁）
  async getByUserId(userId: string, page: number = 1, limit: number = 10): Promise<TDEERecord[]> {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;

    } catch (error) {
      logger.error('Error getting TDEE records by user ID:', error);
      throw new Error('Failed to get TDEE records');
    }
  }

  // 按 ID 獲取單筆記錄
  async getById(id: string, userId?: string): Promise<TDEERecord | null> {
    try {
      let query = 'SELECT * FROM tdee_records WHERE id = $1';
      const values: any[] = [id];

      if (userId) {
        query += ' AND user_id = $2';
        values.push(userId);
      }

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;

    } catch (error) {
      logger.error('Error getting TDEE record by id:', error);
      throw new Error('Failed to get TDEE record');
    }
  }

  // 刪除記錄
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM tdee_records WHERE id = $1 AND user_id = $2';
      const result = await this.pool.query(query, [id, userId]);
      
      const deleted = result.rowCount > 0;
      if (deleted) {
        logger.info(`TDEE record ${id} deleted for user ${userId}`);
      }
      
      return deleted;

    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  // 獲取用戶最新的 TDEE 記錄（用於表單預填）
  async getLatestRecord(userId: string): Promise<TDEERecord | null> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;

    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }

  // 清除用戶所有歷史記錄
  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = 'DELETE FROM tdee_records WHERE user_id = $1';
      const result = await this.pool.query(query, [userId]);
      
      const deletedCount = result.rowCount;
      logger.info(`Cleared ${deletedCount} TDEE records for user ${userId}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('Error clearing TDEE history:', error);
      throw new Error('Failed to clear TDEE history');
    }
  }

  // 統計用戶記錄總數
  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM tdee_records WHERE user_id = $1';
      const result = await this.pool.query(query, [userId]);
      
      return parseInt(result.rows[0].count);

    } catch (error) {
      logger.error('Error getting TDEE record count:', error);
      throw new Error('Failed to get TDEE record count');
    }
  }

  // 依活動等級統計（用於未來統計分析）
  async getRecordsByActivityLevel(userId: string): Promise<{ activity_level: string; count: number }[]> {
    try {
      const query = `
        SELECT activity_level, COUNT(*) as count 
        FROM tdee_records 
        WHERE user_id = $1 
        GROUP BY activity_level 
        ORDER BY count DESC
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows;

    } catch (error) {
      logger.error('Error getting TDEE records by activity level:', error);
      throw new Error('Failed to get TDEE records by activity level');
    }
  }
}
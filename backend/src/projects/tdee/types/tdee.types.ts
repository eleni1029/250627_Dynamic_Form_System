// ===== TDEE 專案模組 - Part 1 =====
// backend/src/projects/tdee/types/tdee.types.ts

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

// ===== TDEE 專案模組 - Part 1 =====
// backend/src/projects/tdee/models/TDEERecord.ts

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

// ===== TDEE 專案模組 - Part 1 =====
// backend/src/projects/tdee/services/TDEEService.ts

import { 
  TDEECalculationRequest, 
  TDEECalculationResult, 
  TDEERecord, 
  TDEEApiResponse, 
  ActivityLevel,
  ACTIVITY_LEVELS 
} from '../types/tdee.types';
import { TDEERecordModel } from '../models/TDEERecord';
import { logger } from '../../../utils/logger';

export class TDEEService {
  private tdeeModel: TDEERecordModel;

  constructor() {
    this.tdeeModel = new TDEERecordModel();
  }

  // 計算基礎代謝率 (BMR) - 使用 Mifflin-St Jeor 方程式 (最準確的國際標準)
  private calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    let bmr: number;

    if (gender === 'male') {
      // 男性: BMR = 88.362 + (13.397 × 體重kg) + (4.799 × 身高cm) - (5.677 × 年齡)
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      // 女性: BMR = 447.593 + (9.247 × 體重kg) + (3.098 × 身高cm) - (4.330 × 年齡)
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    return Math.round(bmr);
  }

  // 計算 TDEE (總日消耗熱量)
  private calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multiplier = ACTIVITY_LEVELS[activityLevel].multiplier;
    return Math.round(bmr * multiplier);
  }

  // 計算 BMI
  private calculateBMI(height: number, weight: number): number {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  }

  // 獲取 BMI 分類
  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return '體重過輕';
    if (bmi < 25) return '正常體重';
    if (bmi < 30) return '超重';
    return '肥胖';
  }

  // 生成熱量建議
  private generateCalorieRecommendations(tdee: number, bmi: number) {
    const baseDeficit = bmi >= 25 ? 500 : 300; // 超重者可以更積極減重
    const baseSurplus = bmi < 18.5 ? 400 : 300; // 體重不足者需要更多熱量

    return {
      weight_loss: Math.max(1200, Math.round(tdee - baseDeficit)),   // 減重：不低於1200卡
      maintenance: tdee,                                             // 維持：等於TDEE
      weight_gain: Math.round(tdee + baseSurplus)                   // 增重：增加300-400卡
    };
  }

  // 生成健康建議
  private generateHealthNotes(bmi: number, age: number, activityLevel: ActivityLevel): string[] {
    const notes: string[] = [];

    // BMI 相關建議
    if (bmi < 18.5) {
      notes.push('您的 BMI 偏低，建議增加健康的熱量攝入');
      notes.push('重點增加蛋白質和健康脂肪的攝取');
    } else if (bmi >= 25) {
      notes.push('您的 BMI 偏高，建議適度控制熱量攝入');
      notes.push('建議增加蔬菜、水果和全穀物的比例');
    } else {
      notes.push('您的 BMI 在健康範圍內，請保持目前的飲食習慣');
    }

    // 活動等級建議
    if (activityLevel === 'sedentary') {
      notes.push('建議增加日常活動量，從每天步行開始');
      notes.push('可以嘗試每週2-3次輕度運動');
    } else if (activityLevel === 'very_active') {
      notes.push('您的運動量很充足，請注意適當休息');
      notes.push('確保攝取足夠的蛋白質幫助肌肉恢復');
    }

    // 年齡相關建議
    if (age >= 65) {
      notes.push('建議定期進行肌力訓練以維持肌肉量');
      notes.push('注意鈣質和維生素D的攝取');
    } else if (age <= 25) {
      notes.push('年輕時期是建立良好飲食和運動習慣的關鍵時期');
    }

    // 通用建議
    notes.push('建議每天攝取足夠的水分（約2-3公升）');
    notes.push('保持規律的作息和充足的睡眠');

    return notes;
  }

  // 執行 TDEE 計算
  async calculate(userId: string, data: TDEECalculationRequest): Promise<TDEEApiResponse<TDEECalculationResult>> {
    try {
      // 基本驗證
      if (!data.height || !data.weight || !data.age || !data.gender || !data.activity_level) {
        return {
          success: false,
          error: 'All fields are required for TDEE calculation',
          code: 'MISSING_REQUIRED_FIELDS'
        };
      }

      // 驗證性別
      if (data.gender !== 'male' && data.gender !== 'female') {
        return {
          success: false,
          error: 'Gender must be either male or female',
          code: 'INVALID_GENDER'
        };
      }

      // 驗證活動等級
      if (!ACTIVITY_LEVELS[data.activity_level]) {
        return {
          success: false,
          error: 'Invalid activity level',
          code: 'INVALID_ACTIVITY_LEVEL'
        };
      }

      // 執行計算
      const bmr = this.calculateBMR(data.weight, data.height, data.age, data.gender);
      const tdee = this.calculateTDEE(bmr, data.activity_level);
      const bmi = this.calculateBMI(data.height, data.weight);
      const bmi_category = this.getBMICategory(bmi);
      const activity_description = ACTIVITY_LEVELS[data.activity_level].description;
      const recommendations = this.generateCalorieRecommendations(tdee, bmi);
      const health_notes = this.generateHealthNotes(bmi, data.age, data.activity_level);

      // 保存用戶輸入數據到資料庫
      await this.tdeeModel.create(userId, data);

      const result: TDEECalculationResult = {
        bmr,
        tdee,
        bmi,
        bmi_category,
        activity_description,
        recommendations,
        health_notes
      };

      logger.info(`TDEE calculated for user ${userId}: BMR=${bmr}, TDEE=${tdee}`);

      return {
        success: true,
        data: result,
        message: 'TDEE calculation completed successfully'
      };

    } catch (error) {
      logger.error('TDEE calculation error:', error);
      return {
        success: false,
        error: 'TDEE calculation failed',
        code: 'TDEE_CALCULATION_ERROR'
      };
    }
  }

  // 獲取用戶歷史記錄
  async getHistory(userId: string, page: number = 1, limit: number = 10): Promise<TDEEApiResponse<TDEERecord[]>> {
    try {
      const records = await this.tdeeModel.getByUserId(userId, page, limit);

      return {
        success: true,
        data: records,
        message: `Retrieved ${records.length} TDEE records`
      };

    } catch (error) {
      logger.error('Get TDEE history error:', error);
      return {
        success: false,
        error: 'Failed to get TDEE history',
        code: 'GET_TDEE_HISTORY_ERROR'
      };
    }
  }
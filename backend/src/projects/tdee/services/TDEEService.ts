// ===== 檔案 7: backend/src/projects/tdee/services/TDEEService.ts - Part 1 =====

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

// ===== 檔案 7 續: backend/src/projects/tdee/services/TDEEService.ts - Part 2 =====
// 接續 Part 1，在 calculate 方法之後加入以下方法：

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

  // 獲取最新記錄（用於表單預填）
  async getLatestRecord(userId: string): Promise<TDEEApiResponse<TDEERecord | null>> {
    try {
      const record = await this.tdeeModel.getLatestRecord(userId);

      return {
        success: true,
        data: record,
        message: record ? 'Latest TDEE record found' : 'No TDEE records found'
      };

    } catch (error) {
      logger.error('Get latest TDEE record error:', error);
      return {
        success: false,
        error: 'Failed to get latest TDEE record',
        code: 'GET_LATEST_TDEE_RECORD_ERROR'
      };
    }
  }

  // 刪除記錄
  async deleteRecord(userId: string, recordId: string): Promise<TDEEApiResponse<boolean>> {
    try {
      const deleted = await this.tdeeModel.delete(recordId, userId);

      if (!deleted) {
        return {
          success: false,
          error: 'TDEE record not found or access denied',
          code: 'TDEE_RECORD_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: true,
        message: 'TDEE record deleted successfully'
      };

    } catch (error) {
      logger.error('Delete TDEE record error:', error);
      return {
        success: false,
        error: 'Failed to delete TDEE record',
        code: 'DELETE_TDEE_RECORD_ERROR'
      };
    }
  }

  // 清空用戶歷史記錄
  async clearHistory(userId: string): Promise<TDEEApiResponse<number>> {
    try {
      const deletedCount = await this.tdeeModel.clearUserHistory(userId);

      return {
        success: true,
        data: deletedCount,
        message: `Cleared ${deletedCount} TDEE records`
      };

    } catch (error) {
      logger.error('Clear TDEE history error:', error);
      return {
        success: false,
        error: 'Failed to clear TDEE history',
        code: 'CLEAR_TDEE_HISTORY_ERROR'
      };
    }
  }

  // 獲取活動等級配置（供前端下拉選單使用）
  getActivityLevels(): TDEEApiResponse<typeof ACTIVITY_LEVELS> {
    return {
      success: true,
      data: ACTIVITY_LEVELS,
      message: 'Activity levels retrieved successfully'
    };
  }

  // 獲取用戶統計資訊
  async getUserStats(userId: string): Promise<TDEEApiResponse<any>> {
    try {
      const [recordCount, activityStats] = await Promise.all([
        this.tdeeModel.getRecordCount(userId),
        this.tdeeModel.getRecordsByActivityLevel(userId)
      ]);

      const stats = {
        total_calculations: recordCount,
        activity_breakdown: activityStats,
        most_used_activity: activityStats.length > 0 ? activityStats[0].activity_level : null
      };

      return {
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      };

    } catch (error) {
      logger.error('Get TDEE user stats error:', error);
      return {
        success: false,
        error: 'Failed to get user statistics',
        code: 'GET_TDEE_STATS_ERROR'
      };
    }
  }

  // 驗證計算數據（用於測試）
  validateCalculationData(data: TDEECalculationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 身高驗證
    if (!data.height || data.height < 50 || data.height > 300) {
      errors.push('Height must be between 50-300 cm');
    }

    // 體重驗證
    if (!data.weight || data.weight < 10 || data.weight > 500) {
      errors.push('Weight must be between 10-500 kg');
    }

    // 年齡驗證
    if (!data.age || data.age < 1 || data.age > 150) {
      errors.push('Age must be between 1-150 years');
    }

    // 性別驗證
    if (!data.gender || !['male', 'female'].includes(data.gender)) {
      errors.push('Gender must be either male or female');
    }

    // 活動等級驗證
    if (!data.activity_level || !ACTIVITY_LEVELS[data.activity_level]) {
      errors.push('Invalid activity level');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
// ===== 檔案 3: backend/src/projects/bmi/services/BMIService.ts =====

import { BMICalculationRequest, BMICalculationResult, BMIRecord, BMIApiResponse } from '../types/bmi.types';
import { BMIRecordModel } from '../models/BMIRecord';
import { logger } from '../../../utils/logger';

export class BMIService {
  private bmiModel: BMIRecordModel;

  constructor() {
    this.bmiModel = new BMIRecordModel();
  }

  // 計算 BMI 值 (WHO 國際標準)
  private calculateBMI(height: number, weight: number): number {
    // 將身高轉換為米
    const heightInMeters = height / 100;
    // BMI = 體重(kg) / 身高²(m²)
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // 保留一位小數
    return Math.round(bmi * 10) / 10;
  }

  // 根據 BMI 值判斷分類 (WHO 國際標準)
  private getBMICategory(bmi: number): { 
    category: string; 
    category_en: string; 
    isHealthy: boolean;
    healthRisk: string;
  } {
    if (bmi < 16) {
      return {
        category: '嚴重體重不足',
        category_en: 'Severe underweight',
        isHealthy: false,
        healthRisk: '高風險'
      };
    } else if (bmi >= 16 && bmi < 17) {
      return {
        category: '中度體重不足',
        category_en: 'Moderate underweight',
        isHealthy: false,
        healthRisk: '中風險'
      };
    } else if (bmi >= 17 && bmi < 18.5) {
      return {
        category: '輕度體重不足',
        category_en: 'Mild underweight',
        isHealthy: false,
        healthRisk: '低風險'
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        category: '正常體重',
        category_en: 'Normal weight',
        isHealthy: true,
        healthRisk: '正常'
      };
    } else if (bmi >= 25 && bmi < 30) {
      return {
        category: '超重',
        category_en: 'Overweight',
        isHealthy: false,
        healthRisk: '低風險'
      };
    } else if (bmi >= 30 && bmi < 35) {
      return {
        category: '一級肥胖',
        category_en: 'Class I obesity',
        isHealthy: false,
        healthRisk: '中風險'
      };
    } else if (bmi >= 35 && bmi < 40) {
      return {
        category: '二級肥胖',
        category_en: 'Class II obesity',
        isHealthy: false,
        healthRisk: '高風險'
      };
    } else {
      return {
        category: '三級肥胖',
        category_en: 'Class III obesity',
        isHealthy: false,
        healthRisk: '極高風險'
      };
    }
  }

  // 根據 BMI 分類生成健康建議
  private generateRecommendations(bmi: number, isHealthy: boolean): string[] {
    const recommendations: string[] = [];

    if (bmi < 16) {
      recommendations.push('請立即諮詢醫師或營養師');
      recommendations.push('可能需要專業的營養治療計畫');
      recommendations.push('逐步增加健康的高熱量食物');
    } else if (bmi >= 16 && bmi < 18.5) {
      recommendations.push('建議增加健康的熱量攝入');
      recommendations.push('選擇營養密度高的食物');
      recommendations.push('進行適度的肌力訓練');
      recommendations.push('定期監測體重變化');
    } else if (bmi >= 18.5 && bmi < 25) {
      recommendations.push('恭喜！您的體重在健康範圍內');
      recommendations.push('保持規律運動習慣');
      recommendations.push('維持均衡飲食');
      recommendations.push('繼續保持健康的生活方式');
    } else if (bmi >= 25 && bmi < 30) {
      recommendations.push('建議適度減少熱量攝入（每日減少300-500卡）');
      recommendations.push('增加有氧運動，每週至少150分鐘');
      recommendations.push('多選擇蔬菜、水果和全穀物');
      recommendations.push('控制份量，避免高糖高脂食物');
    } else if (bmi >= 30 && bmi < 35) {
      recommendations.push('建議諮詢醫師制定減重計畫');
      recommendations.push('結合飲食控制和規律運動');
      recommendations.push('設定合理的減重目標（每週0.5-1公斤）');
      recommendations.push('考慮尋求營養師專業指導');
    } else {
      recommendations.push('強烈建議諮詢醫師');
      recommendations.push('可能需要專業的減重計畫');
      recommendations.push('定期健康檢查');
      recommendations.push('循序漸進增加運動強度');
    }

    return recommendations;
  }

  // 執行 BMI 計算
  async calculate(userId: string, data: BMICalculationRequest): Promise<BMIApiResponse<BMICalculationResult>> {
    try {
      // 基本驗證
      if (!data.height || !data.weight) {
        return {
          success: false,
          error: 'Height and weight are required',
          code: 'MISSING_REQUIRED_FIELDS'
        };
      }

      // 計算 BMI 和分類
      const bmi = this.calculateBMI(data.height, data.weight);
      const { category, category_en, isHealthy, healthRisk } = this.getBMICategory(bmi);
      const recommendations = this.generateRecommendations(bmi, isHealthy);

      // 保存用戶輸入數據到資料庫
      await this.bmiModel.create(userId, data);

      const result: BMICalculationResult = {
        bmi,
        category,
        category_en,
        isHealthy,
        recommendations,
        healthRisk
      };

      logger.info(`BMI calculated for user ${userId}: ${bmi} (${category})`);

      return {
        success: true,
        data: result,
        message: 'BMI calculation completed successfully'
      };

    } catch (error) {
      logger.error('BMI calculation error:', error);
      return {
        success: false,
        error: 'BMI calculation failed',
        code: 'BMI_CALCULATION_ERROR'
      };
    }
  }

  // 獲取用戶歷史記錄
  async getHistory(userId: string, page: number = 1, limit: number = 10): Promise<BMIApiResponse<BMIRecord[]>> {
    try {
      const records = await this.bmiModel.getByUserId(userId, page, limit);

      return {
        success: true,
        data: records,
        message: `Retrieved ${records.length} BMI records`
      };

    } catch (error) {
      logger.error('Get BMI history error:', error);
      return {
        success: false,
        error: 'Failed to get BMI history',
        code: 'GET_BMI_HISTORY_ERROR'
      };
    }
  }

  // 獲取最新記錄（用於表單預填）
  async getLatestRecord(userId: string): Promise<BMIApiResponse<BMIRecord | null>> {
    try {
      const record = await this.bmiModel.getLatestRecord(userId);

      return {
        success: true,
        data: record,
        message: record ? 'Latest BMI record found' : 'No BMI records found'
      };

    } catch (error) {
      logger.error('Get latest BMI record error:', error);
      return {
        success: false,
        error: 'Failed to get latest BMI record',
        code: 'GET_LATEST_BMI_RECORD_ERROR'
      };
    }
  }

  // 刪除記錄
  async deleteRecord(userId: string, recordId: string): Promise<BMIApiResponse<boolean>> {
    try {
      const deleted = await this.bmiModel.delete(recordId, userId);

      if (!deleted) {
        return {
          success: false,
          error: 'BMI record not found or access denied',
          code: 'BMI_RECORD_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: true,
        message: 'BMI record deleted successfully'
      };

    } catch (error) {
      logger.error('Delete BMI record error:', error);
      return {
        success: false,
        error: 'Failed to delete BMI record',
        code: 'DELETE_BMI_RECORD_ERROR'
      };
    }
  }

  // 清空用戶歷史記錄
  async clearHistory(userId: string): Promise<BMIApiResponse<number>> {
    try {
      const deletedCount = await this.bmiModel.clearUserHistory(userId);

      return {
        success: true,
        data: deletedCount,
        message: `Cleared ${deletedCount} BMI records`
      };

    } catch (error) {
      logger.error('Clear BMI history error:', error);
      return {
        success: false,
        error: 'Failed to clear BMI history',
        code: 'CLEAR_BMI_HISTORY_ERROR'
      };
    }
  }
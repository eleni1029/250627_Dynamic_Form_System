import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse, PaginationParams } from '../../../shared/types/common';
import type { TDEEInput, TDEEResult, TDEERecord, ActivityLevel, TDEEStatistics } from '../types';

export const tdeeApi = {
  // 計算 TDEE
  async calculate(data: TDEEInput): Promise<ApiResponse<{
    calculation: TDEEResult;
    input: TDEEInput;
    record: { id: string; created_at: string };
  }>> {
    return await httpClient.post('/projects/tdee/calculate', data);
  },

  // 獲取活動等級
  async getActivityLevels(): Promise<ApiResponse<ActivityLevel[]>> {
    return await httpClient.get('/projects/tdee/activity-levels');
  },

  // 獲取最新記錄
  async getLatest(): Promise<ApiResponse<TDEERecord | null>> {
    return await httpClient.get('/projects/tdee/latest');
  },

  // 獲取歷史記錄
  async getHistory(params?: PaginationParams & { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<ApiResponse<{
    records: TDEERecord[];
    total: number;
    limit: number;
  }>> {
    return await httpClient.get('/projects/tdee/history', params);
  },

  // 獲取統計數據
  async getStats(): Promise<ApiResponse<TDEEStatistics>> {
    return await httpClient.get('/projects/tdee/stats');
  },

  // 獲取營養建議
  async getNutritionAdvice(): Promise<ApiResponse<{
    macronutrients: any;
    calorieGoals: any;
    nutritionAdvice: string[];
    recommendations: any;
    basedOn: any;
  }>> {
    return await httpClient.get('/projects/tdee/nutrition-advice');
  },

  // 驗證數據
  async validateData(data: TDEEInput): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    input: TDEEInput;
  }>> {
    return await httpClient.post('/projects/tdee/validate', data);
  },

  // 驗證活動等級
  async validateActivityLevel(activityLevel: string): Promise<ApiResponse<{
    valid: boolean;
    activityLevel: string;
  }>> {
    return await httpClient.post('/projects/tdee/validate-activity', { 
      activity_level: activityLevel 
    });
  },

  // 刪除記錄
  async deleteRecord(recordId: string): Promise<ApiResponse<{
    deletedRecordId: string;
  }>> {
    return await httpClient.delete(`/projects/tdee/records/${recordId}`);
  },

  // 清空歷史
  async clearHistory(): Promise<ApiResponse<{
    deletedCount: number;
    userId: string;
  }>> {
    return await httpClient.delete('/projects/tdee/history');
  }
};

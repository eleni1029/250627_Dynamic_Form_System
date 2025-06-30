import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse, PaginationParams } from '../../../shared/types/common';
import type { BMIInput, BMIResult, BMIRecord, BMIStatistics } from '../types';

export const bmiApi = {
  // 計算 BMI
  async calculate(data: BMIInput): Promise<ApiResponse<{
    calculation: BMIResult;
    input: BMIInput;
    record: { id: string; created_at: string };
  }>> {
    return await httpClient.post('/projects/bmi/calculate', data);
  },

  // 獲取最新記錄
  async getLatest(): Promise<ApiResponse<BMIRecord | null>> {
    return await httpClient.get('/projects/bmi/latest');
  },

  // 獲取歷史記錄
  async getHistory(params?: PaginationParams & { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<ApiResponse<{
    records: BMIRecord[];
    total: number;
    limit: number;
  }>> {
    return await httpClient.get('/projects/bmi/history', params);
  },

  // 獲取統計數據
  async getStats(): Promise<ApiResponse<BMIStatistics>> {
    return await httpClient.get('/projects/bmi/stats');
  },

  // 獲取趨勢分析
  async getTrend(days: number = 30): Promise<ApiResponse<{
    trend: string;
    records: BMIRecord[];
    summary: any;
  }>> {
    return await httpClient.get('/projects/bmi/trend', { days });
  },

  // 驗證數據
  async validateData(data: BMIInput): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    input: BMIInput;
  }>> {
    return await httpClient.post('/projects/bmi/validate', data);
  },

  // 刪除記錄
  async deleteRecord(recordId: string): Promise<ApiResponse<{
    deletedRecordId: string;
  }>> {
    return await httpClient.delete(`/projects/bmi/records/${recordId}`);
  },

  // 清空歷史
  async clearHistory(): Promise<ApiResponse<{
    deletedCount: number;
    userId: string;
  }>> {
    return await httpClient.delete('/projects/bmi/history');
  }
};

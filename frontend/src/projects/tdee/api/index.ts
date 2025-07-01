// ===== frontend/src/projects/tdee/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { TDEEInput, TDEERecord, ActivityLevel, TDEEStatistics, TDEECalculationResponse } from '../types';

export const tdeeApi = {
  async calculate(data: TDEEInput): Promise<ApiResponse<TDEECalculationResponse>> {
    return await httpClient.post('/projects/tdee/calculate', data);
  },

  async getLastInput(): Promise<ApiResponse<TDEEInput>> {
    return await httpClient.get('/projects/tdee/latest');
  },

  async saveInput(data: TDEEInput): Promise<ApiResponse> {
    return await httpClient.post('/projects/tdee/save-input', data);
  },

  async getActivityLevels(): Promise<ApiResponse<ActivityLevel[]>> {
    return await httpClient.get('/projects/tdee/activity-levels');
  },

  async getHistory(): Promise<ApiResponse<TDEERecord[]>> {
    return await httpClient.get('/projects/tdee/history');
  },

  async getStatistics(): Promise<ApiResponse<TDEEStatistics>> {
    return await httpClient.get('/projects/tdee/stats');
  },

  async deleteRecord(recordId: string): Promise<ApiResponse> {
    return await httpClient.delete(`/projects/tdee/records/${recordId}`);
  },

  async clearHistory(): Promise<ApiResponse> {
    return await httpClient.delete('/projects/tdee/history');
  }
};

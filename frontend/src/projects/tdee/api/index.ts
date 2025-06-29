// ===== frontend/src/projects/tdee/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { TDEEInput, TDEEResult, ActivityLevel } from '../types';

export const tdeeApi = {
  async calculate(data: TDEEInput): Promise<ApiResponse<TDEEResult>> {
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
  }
};
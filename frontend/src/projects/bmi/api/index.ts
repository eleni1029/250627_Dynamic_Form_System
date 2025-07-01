// ===== frontend/src/projects/bmi/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { BMIInput, BMIRecord, BMIStatistics, BMICalculationResponse } from '../types';

export const bmiApi = {
  async calculate(data: BMIInput): Promise<ApiResponse<BMICalculationResponse>> {
    return await httpClient.post('/projects/bmi/calculate', data);
  },

  async getLastInput(): Promise<ApiResponse<BMIInput>> {
    return await httpClient.get('/projects/bmi/latest');
  },

  async saveInput(data: BMIInput): Promise<ApiResponse> {
    return await httpClient.post('/projects/bmi/save-input', data);
  },

  async getHistory(): Promise<ApiResponse<BMIRecord[]>> {
    return await httpClient.get('/projects/bmi/history');
  },

  async getStatistics(): Promise<ApiResponse<BMIStatistics>> {
    return await httpClient.get('/projects/bmi/stats');
  },

  async deleteRecord(recordId: string): Promise<ApiResponse> {
    return await httpClient.delete(`/projects/bmi/records/${recordId}`);
  },

  async clearHistory(): Promise<ApiResponse> {
    return await httpClient.delete('/projects/bmi/history');
  }
};

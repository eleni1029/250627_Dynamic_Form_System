// ===== frontend/src/projects/bmi/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { BMIInput, BMIResult } from '../types';

export const bmiApi = {
  async calculate(data: BMIInput): Promise<ApiResponse<BMIResult>> {
    return await httpClient.post('/projects/bmi/calculate', data);
  },

  async getLastInput(): Promise<ApiResponse<BMIInput>> {
    return await httpClient.get('/projects/bmi/latest');
  },

  async saveInput(data: BMIInput): Promise<ApiResponse> {
    return await httpClient.post('/projects/bmi/save-input', data);
  }
};
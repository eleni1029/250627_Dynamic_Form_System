#!/bin/bash

echo "🔧 修復未使用的導入問題"
echo "======================"

# ===== 1. 修復 BMI API 導入 =====
echo "📝 修復 BMI API 導入..."

cat > frontend/src/projects/bmi/api/index.ts << 'EOF'
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
EOF

# ===== 2. 修復 TDEE API 導入 =====
echo "📝 修復 TDEE API 導入..."

cat > frontend/src/projects/tdee/api/index.ts << 'EOF'
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
EOF

echo ""
echo "✅ 修復完成！移除了未使用的導入："
echo "   - BMIResult (在 BMI API 中未使用)"
echo "   - TDEEResult (在 TDEE API 中未使用)"
echo ""
echo "🚀 現在再次執行 TypeScript 檢查："
echo "cd frontend && npx vue-tsc --noEmit"
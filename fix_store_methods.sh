#!/bin/bash

echo "🔧 修復 API 類型定義和 Store 數據處理"
echo "====================================="

# ===== 1. 修復 BMI 類型定義 - 添加缺失的接口 =====
echo "📝 修復 BMI 類型定義..."

cat > frontend/src/projects/bmi/types/index.ts << 'EOF'
// ===== frontend/src/projects/bmi/types/index.ts =====
export interface BMIInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
}

export interface BMIResult {
  bmi: number;
  category: string;
  category_cn: string;
  categoryCode: string;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
  severity?: string;
  colorCode?: string;
}

export interface BMIFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
}

// 添加缺失的類型
export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  age?: number;
  gender?: string;
  created_at: string;
}

export interface BMIStatistics {
  totalRecords: number;
  averageBMI: number;
  lastCategory: string;
  trend: 'up' | 'down' | 'stable';
}

// API 響應類型
export interface BMICalculationResponse {
  calculation: BMIResult;
  input: BMIInput;
  record: {
    id: string;
    created_at: string;
  };
}
EOF

# ===== 2. 修復 TDEE 類型定義 - 添加缺失的接口 =====
echo "📝 修復 TDEE 類型定義..."

cat > frontend/src/projects/tdee/types/index.ts << 'EOF'
// ===== frontend/src/projects/tdee/types/index.ts =====
export interface TDEEInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activity_factor: number;
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
    chineseName?: string;
    intensity?: string;
  };
  weightGoal?: {
    maintain: number;
    mildLoss: number;
    moderateLoss: number;
    aggressiveLoss: number;
    mildGain: number;
    moderateGain: number;
  };
  metabolicAge?: number;
}

export interface TDEEFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
  activity_level: string;
}

export interface ActivityLevel {
  value: string;
  label: string;
  description?: string;
}

// 添加缺失的類型
export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr: number;
  tdee: number;
  activity_factor: number;
  created_at: string;
}

export interface TDEEStatistics {
  totalRecords: number;
  averageTDEE: number;
  averageBMR: number;
  mostCommonActivityLevel: string;
  trend: 'up' | 'down' | 'stable';
}

// API 響應類型
export interface TDEECalculationResponse {
  calculation: TDEEResult;
  input: TDEEInput;
  record: {
    id: string;
    created_at: string;
  };
}
EOF

# ===== 3. 修復 BMI API 定義 =====
echo "📝 修復 BMI API..."

cat > frontend/src/projects/bmi/api/index.ts << 'EOF'
// ===== frontend/src/projects/bmi/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { BMIInput, BMIResult, BMIRecord, BMIStatistics, BMICalculationResponse } from '../types';

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

# ===== 4. 修復 TDEE API 定義 =====
echo "📝 修復 TDEE API..."

cat > frontend/src/projects/tdee/api/index.ts << 'EOF'
// ===== frontend/src/projects/tdee/api/index.ts =====
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse } from '../../../shared/types/common';
import type { TDEEInput, TDEEResult, TDEERecord, ActivityLevel, TDEEStatistics, TDEECalculationResponse } from '../types';

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

# ===== 5. 修復 BMI Store - 處理正確的 API 響應結構 =====
echo "📝 修復 BMI Store..."

cat > frontend/src/projects/bmi/stores/bmi.ts << 'EOF'
// ===== frontend/src/projects/bmi/stores/bmi.ts =====
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { bmiApi } from '../api';
import type { BMIInput, BMIResult } from '../types';

export const useBMIStore = defineStore('bmi', () => {
  const lastInput = ref<BMIInput | null>(null);
  const lastResult = ref<BMIResult | null>(null);
  const isLoading = ref(false);

  const loadLastInput = async () => {
    try {
      const response = await bmiApi.getLastInput();
      if (response.success && response.data) {
        lastInput.value = response.data;
      }
    } catch (error) {
      console.error('載入上次輸入失敗:', error);
    }
  };

  const calculate = async (input: BMIInput): Promise<BMIResult> => {
    isLoading.value = true;
    try {
      const response = await bmiApi.calculate(input);
      if (response.success && response.data) {
        // API 返回 { calculation: BMIResult, input: BMIInput, record: {...} }
        // 我們只需要 calculation 部分
        const calculationResult = response.data.calculation;
        lastResult.value = calculationResult;
        lastInput.value = input;
        return calculationResult;
      }
      throw new Error(response.error || '計算失敗');
    } finally {
      isLoading.value = false;
    }
  };

  const saveInput = async (input: BMIInput) => {
    try {
      await bmiApi.saveInput(input);
      lastInput.value = input;
    } catch (error) {
      console.error('保存輸入失敗:', error);
    }
  };

  const resetState = () => {
    lastInput.value = null;
    lastResult.value = null;
    isLoading.value = false;
  };

  return {
    lastInput,
    lastResult,
    isLoading,
    loadLastInput,
    calculate,
    saveInput,
    resetState
  };
});
EOF

# ===== 6. 修復 TDEE Store - 處理正確的 API 響應結構 =====
echo "📝 修復 TDEE Store..."

cat > frontend/src/projects/tdee/stores/tdee.ts << 'EOF'
// ===== frontend/src/projects/tdee/stores/tdee.ts =====
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tdeeApi } from '../api';
import type { TDEEInput, TDEEResult, ActivityLevel } from '../types';

export const useTDEEStore = defineStore('tdee', () => {
  const lastInput = ref<TDEEInput | null>(null);
  const lastResult = ref<TDEEResult | null>(null);
  const activityLevels = ref<ActivityLevel[]>([]);
  const isLoading = ref(false);

  const loadLastInput = async () => {
    try {
      const response = await tdeeApi.getLastInput();
      if (response.success && response.data) {
        lastInput.value = response.data;
      }
    } catch (error) {
      console.error('載入上次輸入失敗:', error);
    }
  };

  const loadActivityLevels = async () => {
    try {
      const response = await tdeeApi.getActivityLevels();
      if (response.success && response.data) {
        activityLevels.value = response.data;
      } else {
        // 如果 API 失敗，使用預設值
        activityLevels.value = [
          { value: 'sedentary', label: '久坐不動' },
          { value: 'light', label: '輕度活動' },
          { value: 'moderate', label: '中度活動' },
          { value: 'active', label: '積極活動' },
          { value: 'very_active', label: '非常活躍' }
        ];
      }
    } catch (error) {
      console.error('載入活動等級失敗:', error);
      // 提供預設值以避免錯誤
      activityLevels.value = [
        { value: 'sedentary', label: '久坐不動' },
        { value: 'light', label: '輕度活動' },
        { value: 'moderate', label: '中度活動' },
        { value: 'active', label: '積極活動' },
        { value: 'very_active', label: '非常活躍' }
      ];
    }
  };

  const calculate = async (input: TDEEInput): Promise<TDEEResult> => {
    isLoading.value = true;
    try {
      const response = await tdeeApi.calculate(input);
      if (response.success && response.data) {
        // API 返回 { calculation: TDEEResult, input: TDEEInput, record: {...} }
        // 我們只需要 calculation 部分
        const calculationResult = response.data.calculation;
        lastResult.value = calculationResult;
        lastInput.value = input;
        return calculationResult;
      }
      throw new Error(response.error || '計算失敗');
    } finally {
      isLoading.value = false;
    }
  };

  const saveInput = async (input: TDEEInput) => {
    try {
      await tdeeApi.saveInput(input);
      lastInput.value = input;
    } catch (error) {
      console.error('保存輸入失敗:', error);
    }
  };

  const resetState = () => {
    lastInput.value = null;
    lastResult.value = null;
    isLoading.value = false;
  };

  return {
    lastInput,
    lastResult,
    activityLevels,
    isLoading,
    loadLastInput,
    loadActivityLevels,
    calculate,
    saveInput,
    resetState
  };
});
EOF

echo ""
echo "🎯 修復完成！解決的問題："
echo "✅ 添加了缺失的類型定義：BMIRecord, BMIStatistics, TDEERecord, TDEEStatistics"
echo "✅ 修復了 API 方法定義，添加了 getLastInput 和 saveInput 方法"
echo "✅ 修復了 Store 中的數據處理邏輯，正確解析 API 響應結構"
echo "✅ BMI 和 TDEE 的 calculate 方法現在正確返回 calculation 部分"
echo "✅ 所有 Store 方法都已正確導出"
echo ""
echo "🚀 現在執行 TypeScript 檢查："
echo "cd frontend && npx vue-tsc --noEmit"
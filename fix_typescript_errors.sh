#!/bin/bash

echo "🔧 修復 TypeScript 編譯錯誤"
echo "============================"

# ===== 1. 修復後端 TDEE 類型文件錯誤 =====
echo "📝 修復後端 TDEE 類型文件..."

# 修復 tdee.types.ts 中的語法錯誤
if [ -f "backend/src/projects/tdee/types/tdee.types.ts" ]; then
    # 移除有問題的文件，因為我們已經有了新的模組化類型
    rm backend/src/projects/tdee/types/tdee.types.ts
    echo "✅ 移除舊的 tdee.types.ts 文件"
fi

# ===== 2. 完善前端共享類型 =====
echo "📝 完善前端共享類型..."

cat > frontend/src/shared/types/common.ts << 'EOF'
// ===== frontend/src/shared/types/common.ts =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  key: string;
  name: string;
  description: string;
  path: string;
  version?: string;
  features?: string[];
  endpoints?: Record<string, string>;
}

export interface UserProjectPermission {
  user_id: string;
  project_id: string;
  project: Project;
  granted_at?: string;
}

// 分頁相關類型
export interface PaginationParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 錯誤處理類型
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: ValidationError[] | any;
  timestamp?: string;
}

// 統計相關類型
export interface Trend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  timeframe: string;
}

export interface BaseStatistics {
  totalRecords: number;
  lastCalculated: string | null;
  trend: Trend;
}

// 表單狀態類型
export interface FormState {
  isLoading: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// 通用的選項類型
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

// 本地化類型
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

// 主題配置類型
export interface ThemeConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// 通用工具類型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}
EOF

echo "✅ 前端共享類型已完善"

# ===== 3. 完善前端 BMI 類型 =====
echo "📝 完善前端 BMI 類型..."

cat > frontend/src/projects/bmi/types/index.ts << 'EOF'
// ===== frontend/src/projects/bmi/types/index.ts =====
export interface BMIInput {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female';
}

export interface BMIResult {
  bmi: number;
  category: string;
  categoryCode: string;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
  severity?: string;
  colorCode?: string;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  category_code: string;
  age?: number;
  gender?: string;
  is_healthy: boolean;
  who_classification: string;
  health_risks: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface BMIStatistics {
  totalRecords: number;
  averageBMI: number | null;
  latestBMI: number | null;
  latestCategory: string | null;
  lastCalculated: string | null;
  trend: string;
}

export interface BMIFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
}

// BMI 分類
export type BMICategory = 
  | 'severely_underweight' 
  | 'underweight' 
  | 'normal' 
  | 'overweight' 
  | 'obese_class1' 
  | 'obese_class2' 
  | 'obese_class3';

export interface BMIClassification {
  category: string;
  range: { min: number; max: number };
  description: string;
  healthRisks: string[];
  recommendations: string[];
  colorCode: string;
}
EOF

echo "✅ 前端 BMI 類型已完善"

# ===== 4. 完善前端 TDEE 類型 =====
echo "📝 完善前端 TDEE 類型..."

cat > frontend/src/projects/tdee/types/index.ts << 'EOF'
// ===== frontend/src/projects/tdee/types/index.ts =====
export interface TDEEInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr_formula?: string;
  body_fat_percentage?: number;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
    chineseName?: string;
    intensity?: string;
  };
  macronutrients?: any;
  recommendations?: any;
  calorieGoals?: any;
  nutritionAdvice?: string[];
  bmrFormula?: string;
  metabolicAge?: number;
}

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
  activity_multiplier: number;
  macronutrients: any;
  recommendations: any;
  calorie_goals: any;
  nutrition_advice: string[];
  created_at: string;
  updated_at: string;
}

export interface TDEEStatistics {
  totalCalculations: number;
  latestTDEE: number | null;
  latestBMR: number | null;
  averageTDEE: number | null;
  mostUsedActivityLevel: string;
  lastCalculated: string | null;
  tdeeRange: { min: number; max: number } | null;
  bmrTrend: string;
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
  multiplier?: number;
}

export type ActivityLevelKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
EOF

echo "✅ 前端 TDEE 類型已完善"

# ===== 5. 修復前端 BMI API =====
echo "📝 修復前端 BMI API..."

cat > frontend/src/projects/bmi/api/index.ts << 'EOF'
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
  async getHistory(params?: PaginationParams): Promise<ApiResponse<{
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
EOF

echo "✅ 前端 BMI API 已修復"

# ===== 6. 修復前端 TDEE API =====
echo "📝 修復前端 TDEE API..."

cat > frontend/src/projects/tdee/api/index.ts << 'EOF'
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
  async getHistory(params?: PaginationParams): Promise<ApiResponse<{
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
EOF

echo "✅ 前端 TDEE API 已修復"

# ===== 7. 修復前端 HTTP 客戶端 =====
echo "📝 修復前端 HTTP 客戶端..."

cat > frontend/src/shared/utils/http.ts << 'EOF'
import type { ApiResponse } from '../types/common';

class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    // 修復 Vite 環境變數訪問
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.timeout = 10000; // 10 秒超時
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 重要：包含 cookies 用於 session
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load TDEE history';
      console.error('TDEE history loading error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 清除結果
  const clearResult = () => {
    lastResult.value = null;
    error.value = null;
  };

  // 清除歷史
  const clearHistory = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await tdeeApi.clearHistory();
      
      if (response.success) {
        history.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear TDEE history';
      console.error('TDEE history clearing error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 刪除特定記錄
  const deleteRecord = async (recordId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await tdeeApi.deleteRecord(recordId);
      
      if (response.success) {
        history.value = history.value.filter(record => record.id !== recordId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete TDEE record';
      console.error('TDEE record deletion error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // 狀態
    isLoading,
    lastResult,
    lastInput,
    history,
    activityLevels,
    error,
    
    // 計算屬性
    hasResult,
    hasHistory,
    
    // 方法
    initializeData,
    calculateTDEE,
    loadHistory,
    clearResult,
    clearHistory,
    deleteRecord
  };
});
EOF

echo "✅ 前端 TDEE store 已修復"
fi

# ===== 10. 創建前端基本文件 (如果不存在) =====
echo "📝 創建前端基本文件..."

# 創建 App.vue (如果不存在)
if [ ! -f "frontend/src/App.vue" ]; then
cat > frontend/src/App.vue << 'EOF'
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 主應用組件
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
EOF
echo "✅ 創建 App.vue"
fi

# 創建基本視圖文件
mkdir -p frontend/src/views

if [ ! -f "frontend/src/views/Home.vue" ]; then
cat > frontend/src/views/Home.vue << 'EOF'
<template>
  <div class="home">
    <h1>Dynamic Form System</h1>
    <p>歡迎使用動態表單系統</p>
    
    <div class="project-links">
      <router-link to="/bmi" class="project-link">
        <h3>BMI 計算器</h3>
        <p>計算身體質量指數</p>
      </router-link>
      
      <router-link to="/tdee" class="project-link">
        <h3>TDEE 計算器</h3>
        <p>計算每日總能量消耗</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首頁組件
</script>

<style scoped>
.home {
  padding: 20px;
  text-align: center;
}

.project-links {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

.project-link {
  display: block;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
}

.project-link:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px);
}
</style>
EOF
echo "✅ 創建 Home.vue"
fi

if [ ! -f "frontend/src/views/Login.vue" ]; then
cat > frontend/src/views/Login.vue << 'EOF'
<template>
  <div class="login">
    <h1>登入</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用戶名：</label>
        <input 
          id="username"
          v-model="form.username" 
          type="text" 
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="password">密碼：</label>
        <input 
          id="password"
          v-model="form.password" 
          type="password" 
          required 
        />
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '登入中...' : '登入' }}
      </button>
    </form>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
  username: '',
  password: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleLogin = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // TODO: 實現登入邏輯
    console.log('Login attempt:', form.value);
    
    // 模擬登入成功
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/');
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登入失敗';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
EOF
echo "✅ 創建 Login.vue"
fi

# ===== 11. 修復路由配置 =====
echo "📝 修復路由配置..."

if [ ! -f "frontend/src/router/index.ts" ]; then
mkdir -p frontend/src/router

cat > frontend/src/router/index.ts << 'EOF'
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/bmi',
      name: 'BMI',
      component: () => import('../projects/bmi/components/BMICalculator.vue'),
    },
    {
      path: '/tdee',
      name: 'TDEE',
      component: () => import('../projects/tdee/components/TDEECalculator.vue'),
    }
  ]
});

export default router;
EOF

echo "✅ 路由配置已修復"
fi

# ===== 12. 修復 Vite 配置（如果需要） =====
echo "📝 檢查並修復 Vite 配置..."

if [ -f "frontend/vite.config.ts" ]; then
cat > frontend/vite.config.ts << 'EOF'
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env': 'import.meta.env',
  },
});
EOF

echo "✅ Vite 配置已修復"
fi

# ===== 13. 創建基本組件（如果不存在） =====
echo "📝 創建基本組件..."

mkdir -p frontend/src/projects/bmi/components
mkdir -p frontend/src/projects/tdee/components

if [ ! -f "frontend/src/projects/bmi/components/BMICalculator.vue" ]; then
cat > frontend/src/projects/bmi/components/BMICalculator.vue << 'EOF'
<template>
  <div class="bmi-calculator">
    <h1>BMI 計算器</h1>
    <p>計算您的身體質量指數</p>
    
    <form @submit.prevent="handleCalculate">
      <div class="form-group">
        <label for="height">身高 (cm)：</label>
        <input 
          id="height"
          v-model.number="form.height" 
          type="number" 
          min="50" 
          max="300"
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="weight">體重 (kg)：</label>
        <input 
          id="weight"
          v-model.number="form.weight" 
          type="number" 
          min="10" 
          max="500"
          required 
        />
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '計算中...' : '計算 BMI' }}
      </button>
    </form>
    
    <div v-if="result" class="result">
      <h3>計算結果</h3>
      <p><strong>BMI：</strong>{{ result.bmi }}</p>
      <p><strong>分類：</strong>{{ result.category }}</p>
      <p><strong>健康狀態：</strong>{{ result.isHealthy ? '健康' : '需要注意' }}</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBMIStore } from '../stores/bmi';
import type { BMIInput } from '../types';

const bmiStore = useBMIStore();

const form = ref<BMIInput>({
  height: 0,
  weight: 0
});

const isLoading = ref(false);
const error = ref<string | null>(null);
const result = ref(null);

const handleCalculate = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    await bmiStore.calculateBMI(form.value);
    result.value = bmiStore.lastResult;
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'BMI 計算失敗';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  bmiStore.initializeData();
});
</script>

<style scoped>
.bmi-calculator {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
EOF

echo "✅ 創建 BMI 計算器組件"
fi

if [ ! -f "frontend/src/projects/tdee/components/TDEECalculator.vue" ]; then
cat > frontend/src/projects/tdee/components/TDEECalculator.vue << 'EOF'
<template>
  <div class="tdee-calculator">
    <h1>TDEE 計算器</h1>
    <p>計算您的每日總能量消耗</p>
    
    <form @submit.prevent="handleCalculate">
      <div class="form-group">
        <label for="height">身高 (cm)：</label>
        <input 
          id="height"
          v-model.number="form.height" 
          type="number" 
          min="50" 
          max="300"
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="weight">體重 (kg)：</label>
        <input 
          id="weight"
          v-model.number="form.weight" 
          type="number" 
          min="10" 
          max="500"
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="age">年齡：</label>
        <input 
          id="age"
          v-model.number="form.age" 
          type="number" 
          min="1" 
          max="150"
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="gender">性別：</label>
        <select id="gender" v-model="form.gender" required>
          <option value="">請選擇</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="activity_level">活動等級：</label>
        <select id="activity_level" v-model="form.activity_level" required>
          <option value="">請選擇</option>
          <option value="sedentary">久坐不動</option>
          <option value="light">輕度活動</option>
          <option value="moderate">中度活動</option>
          <option value="active">積極活動</option>
          <option value="very_active">非常活躍</option>
        </select>
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '計算中...' : '計算 TDEE' }}
      </button>
    </form>
    
    <div v-if="result" class="result">
      <h3>計算結果</h3>
      <p><strong>BMR：</strong>{{ result.bmr }} 卡路里/天</p>
      <p><strong>TDEE：</strong>{{ result.tdee }} 卡路里/天</p>
      <p><strong>活動等級：</strong>{{ result.activityInfo?.name }}</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTDEEStore } from '../stores/tdee';
import type { TDEEInput } from '../types';

const tdeeStore = useTDEEStore();

const form = ref<TDEEInput>({
  height: 0,
  weight: 0,
  age: 0,
  gender: 'male',
  activity_level: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);
const result = ref(null);

const handleCalculate = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    await tdeeStore.calculateTDEE(form.value);
    result.value = tdeeStore.lastResult;
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'TDEE 計算失敗';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  tdeeStore.initializeData();
});
</script>

<style scoped>
.tdee-calculator {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
EOF

echo "✅ 創建 TDEE 計算器組件"
fi

echo ""
echo "🎉 TypeScript 錯誤修復完成！"
echo "=========================="
echo ""
echo "📋 修復內容總結："
echo "   ✅ 修復後端 TDEE 類型語法錯誤"
echo "   ✅ 完善前端共享類型定義"
echo "   ✅ 修復前端 BMI/TDEE 類型定義"
echo "   ✅ 修復前端 API 接口"
echo "   ✅ 修復前端 HTTP 客戶端"
echo "   ✅ 修復前端 Store 狀態管理"
echo "   ✅ 創建基本 Vue 組件和路由"
echo "   ✅ 修復 Vite 環境變數問題"
echo ""
echo "🔧 現在請執行："
echo "   bash fix_typescript_errors.sh"
echo "   然後重新運行檢查："
echo "   bash check_modularity_complete.sh"or) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        console.error(`HTTP request failed: ${endpoint}`, error);
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 上傳文件的專用方法
  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // 讓瀏覽器自動設置 multipart/form-data 邊界
    });
  }

  // 健康檢查
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // 設置基礎 URL
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // 設置超時時間
  setTimeout(ms: number): void {
    this.timeout = ms;
  }
}

export const httpClient = new HttpClient();

// 導出類型以供其他模組使用
export type { ApiResponse };
EOF

echo "✅ 前端 HTTP 客戶端已修復"

# ===== 8. 修復前端 BMI store =====
echo "📝 修復前端 BMI store..."

if [ -f "frontend/src/projects/bmi/stores/bmi.ts" ]; then
cat > frontend/src/projects/bmi/stores/bmi.ts << 'EOF'
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { bmiApi } from '../api';
import type { BMIInput, BMIResult, BMIRecord, BMIFormData } from '../types';

export const useBMIStore = defineStore('bmi', () => {
  // 狀態
  const isLoading = ref(false);
  const lastResult = ref<BMIResult | null>(null);
  const lastInput = ref<BMIInput | null>(null);
  const history = ref<BMIRecord[]>([]);
  const error = ref<string | null>(null);

  // 計算屬性
  const hasResult = computed(() => lastResult.value !== null);
  const hasHistory = computed(() => history.value.length > 0);

  // 初始化數據
  const initializeData = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 獲取最新記錄
      const response = await bmiApi.getLatest();
      if (response.success && response.data) {
        const record = response.data;
        lastInput.value = {
          height: record.height,
          weight: record.weight,
          age: record.age,
          gender: record.gender as 'male' | 'female' | undefined
        };
        lastResult.value = {
          bmi: record.bmi,
          category: record.category,
          categoryCode: record.category_code,
          isHealthy: record.is_healthy,
          whoStandard: record.who_classification,
          healthRisks: record.health_risks,
          recommendations: record.recommendations
        };
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize BMI data';
      console.error('BMI store initialization error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 計算 BMI
  const calculateBMI = async (input: BMIInput) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await bmiApi.calculate(input);
      
      if (response.success && response.data) {
        lastInput.value = input;
        lastResult.value = response.data.calculation;
        
        // 添加到歷史記錄的開頭
        if (response.data.record) {
          const newRecord: BMIRecord = {
            id: response.data.record.id,
            user_id: '', // 會由後端填入
            ...input,
            ...response.data.calculation,
            health_risks: response.data.calculation.healthRisks,
            recommendations: response.data.calculation.recommendations,
            who_classification: response.data.calculation.whoStandard,
            created_at: response.data.record.created_at,
            updated_at: response.data.record.created_at
          };
          history.value.unshift(newRecord);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'BMI calculation failed';
      console.error('BMI calculation error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 獲取歷史記錄
  const loadHistory = async (limit: number = 50) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await bmiApi.getHistory({ limit });
      
      if (response.success && response.data) {
        history.value = response.data.records;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load BMI history';
      console.error('BMI history loading error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 清除結果
  const clearResult = () => {
    lastResult.value = null;
    error.value = null;
  };

  // 清除歷史
  const clearHistory = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await bmiApi.clearHistory();
      
      if (response.success) {
        history.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear BMI history';
      console.error('BMI history clearing error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 刪除特定記錄
  const deleteRecord = async (recordId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await bmiApi.deleteRecord(recordId);
      
      if (response.success) {
        history.value = history.value.filter(record => record.id !== recordId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete BMI record';
      console.error('BMI record deletion error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // 狀態
    isLoading,
    lastResult,
    lastInput,
    history,
    error,
    
    // 計算屬性
    hasResult,
    hasHistory,
    
    // 方法
    initializeData,
    calculateBMI,
    loadHistory,
    clearResult,
    clearHistory,
    deleteRecord
  };
});
EOF

echo "✅ 前端 BMI store 已修復"
fi

# ===== 9. 修復前端 TDEE store =====
echo "📝 修復前端 TDEE store..."

if [ -f "frontend/src/projects/tdee/stores/tdee.ts" ]; then
cat > frontend/src/projects/tdee/stores/tdee.ts << 'EOF'
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tdeeApi } from '../api';
import type { TDEEInput, TDEEResult, TDEERecord, ActivityLevel } from '../types';

export const useTDEEStore = defineStore('tdee', () => {
  // 狀態
  const isLoading = ref(false);
  const lastResult = ref<TDEEResult | null>(null);
  const lastInput = ref<TDEEInput | null>(null);
  const history = ref<TDEERecord[]>([]);
  const activityLevels = ref<ActivityLevel[]>([]);
  const error = ref<string | null>(null);

  // 計算屬性
  const hasResult = computed(() => lastResult.value !== null);
  const hasHistory = computed(() => history.value.length > 0);

  // 初始化數據
  const initializeData = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 獲取活動等級列表
      const levelsResponse = await tdeeApi.getActivityLevels();
      if (levelsResponse.success && levelsResponse.data) {
        activityLevels.value = levelsResponse.data;
      }
      
      // 獲取最新記錄
      const response = await tdeeApi.getLatest();
      if (response.success && response.data) {
        const record = response.data;
        lastInput.value = {
          height: record.height,
          weight: record.weight,
          age: record.age,
          gender: record.gender,
          activity_level: record.activity_level
        };
        lastResult.value = {
          bmr: record.bmr,
          tdee: record.tdee,
          activityInfo: {
            level: record.activity_level,
            multiplier: record.activity_multiplier,
            description: '',
            name: record.activity_level
          },
          macronutrients: record.macronutrients,
          recommendations: record.recommendations,
          calorieGoals: record.calorie_goals,
          nutritionAdvice: record.nutrition_advice
        };
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize TDEE data';
      console.error('TDEE store initialization error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 計算 TDEE
  const calculateTDEE = async (input: TDEEInput) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await tdeeApi.calculate(input);
      
      if (response.success && response.data) {
        lastInput.value = input;
        lastResult.value = response.data.calculation;
        
        // 添加到歷史記錄的開頭
        if (response.data.record) {
          const newRecord: TDEERecord = {
            id: response.data.record.id,
            user_id: '', // 會由後端填入
            ...input,
            bmr: response.data.calculation.bmr,
            tdee: response.data.calculation.tdee,
            activity_multiplier: response.data.calculation.activityInfo.multiplier,
            macronutrients: response.data.calculation.macronutrients || {},
            recommendations: response.data.calculation.recommendations || {},
            calorie_goals: response.data.calculation.calorieGoals || {},
            nutrition_advice: response.data.calculation.nutritionAdvice || [],
            created_at: response.data.record.created_at,
            updated_at: response.data.record.created_at
          };
          history.value.unshift(newRecord);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'TDEE calculation failed';
      console.error('TDEE calculation error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 獲取歷史記錄
  const loadHistory = async (limit: number = 50) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await tdeeApi.getHistory({ limit });
      
      if (response.success && response.data) {
        history.value = response.data.records;
      }
    } catch (err)
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
            bmi: response.data.calculation.bmi,
            category: response.data.calculation.category,
            category_code: response.data.calculation.categoryCode,
            is_healthy: response.data.calculation.isHealthy,
            who_classification: response.data.calculation.whoStandard,
            health_risks: response.data.calculation.healthRisks,
            recommendations: response.data.calculation.recommendations,
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

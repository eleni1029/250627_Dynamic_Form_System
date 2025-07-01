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

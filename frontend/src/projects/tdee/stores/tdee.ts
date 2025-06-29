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
    }
  };

  const calculate = async (input: TDEEInput) => {
    isLoading.value = true;
    try {
      const response = await tdeeApi.calculate(input);
      if (response.success && response.data) {
        lastResult.value = response.data;
        await saveInput(input);
        return response.data;
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
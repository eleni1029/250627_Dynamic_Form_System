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

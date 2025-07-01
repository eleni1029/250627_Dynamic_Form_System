<!-- ===== frontend/src/projects/bmi/components/BMIResult.vue ===== -->
<template>
  <el-card class="bmi-result">
    <template #header>
      <h4>BMI 計算結果</h4>
    </template>
    
    <div class="result-content">
      <div class="bmi-display">
        <div class="bmi-value">
          <span class="bmi-number">{{ result.bmi }}</span>
          <span class="bmi-unit">kg/m²</span>
        </div>
        <div class="bmi-category" :class="getCategoryClass(result.category)">
          {{ result.category_cn || result.category }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { BMIResult } from '../types';

interface Props {
  result: BMIResult;
}

defineProps<Props>();

const getCategoryClass = (category: string) => {
  const classMap: Record<string, string> = {
    'underweight': 'category-underweight',
    'normal': 'category-normal',
    'overweight': 'category-overweight',
    'obese': 'category-obese'
  };
  return classMap[category] || '';
};
</script>

<style scoped>
.bmi-result {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-content {
  text-align: center;
  padding: 20px 0;
}

.bmi-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.bmi-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.bmi-number {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
}

.bmi-unit {
  font-size: 14px;
  color: #909399;
}

.bmi-category {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 16px;
}

.category-underweight {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.category-normal {
  background-color: #f0f9ff;
  color: #67c23a;
}

.category-overweight {
  background-color: #fef0f0;
  color: #f56c6c;
}

.category-obese {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>

<template>
 <el-card class="tdee-result">
   <template #header>
     <h4>TDEE 計算結果</h4>
   </template>
   
   <div class="result-content">
     <div class="result-items">
       <div class="result-item">
         <div class="result-label">基礎代謝率 (BMR)</div>
         <div class="result-value">
           <span class="result-number">{{ result.bmr }}</span>
           <span class="result-unit">kcal/日</span>
         </div>
       </div>
       
       <div class="result-item">
         <div class="result-label">每日總消耗 (TDEE)</div>
         <div class="result-value">
           <span class="result-number primary">{{ result.tdee }}</span>
           <span class="result-unit">kcal/日</span>
         </div>
       </div>
       
       <div class="result-item">
         <div class="result-label">活動係數</div>
         <div class="result-value">
           <span class="result-number">{{ result.activity_factor }}</span>
         </div>
       </div>
     </div>
   </div>
 </el-card>
</template>

<script setup lang="ts">
import type { TDEEResult } from '../types';

interface Props {
 result: TDEEResult;
}

defineProps<Props>();
</script>

<style scoped>
.tdee-result {
 box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-content {
 padding: 20px 0;
}

.result-items {
 display: flex;
 flex-direction: column;
 gap: 20px;
}

.result-item {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 15px;
 background-color: #f8f9fa;
 border-radius: 8px;
}

.result-label {
 font-size: 14px;
 color: #606266;
 font-weight: 500;
}

.result-value {
 display: flex;
 align-items: baseline;
 gap: 6px;
}

.result-number {
 font-size: 24px;
 font-weight: bold;
 color: #303133;
}

.result-number.primary {
 font-size: 28px;
 color: #409EFF;
}

.result-unit {
 font-size: 12px;
 color: #909399;
}

@media (max-width: 768px) {
 .result-item {
   flex-direction: column;
   text-align: center;
   gap: 10px;
 }
}
</style>

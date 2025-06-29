<!-- ===== frontend/src/projects/tdee/components/TDEECalculator.vue ===== -->
<template>
  <div class="tdee-calculator">
    <el-card class="calculator-card">
      <template #header>
        <h3>TDEE 計算器</h3>
      </template>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        @submit.prevent="handleCalculate"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="身高" prop="height">
              <el-input
                v-model.number="formData.height"
                placeholder="請輸入身高"
                suffix-text="cm"
                type="number"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="體重" prop="weight">
              <el-input
                v-model.number="formData.weight"
                placeholder="請輸入體重"
                suffix-text="kg"
                type="number"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="年齡" prop="age">
              <el-input
                v-model.number="formData.age"
                placeholder="請輸入年齡"
                suffix-text="歲"
                type="number"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="性別" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio value="male">男性</el-radio>
                <el-radio value="female">女性</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="活動等級" prop="activity_level">
          <el-select
            v-model="formData.activity_level"
            placeholder="請選擇活動等級"
            style="width: 100%"
          >
            <el-option
              v-for="level in activityLevels"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item class="form-actions">
          <el-button
            type="primary"
            @click="handleCalculate"
            :loading="isLoading"
          >
            計算 TDEE
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <tdee-result v-if="result" :result="result" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useTDEEStore } from '../stores/tdee';
import TDEEResult from './TDEEResult.vue';
import type { TDEEFormData, TDEEResult } from '../types';

const formRef = ref<FormInstance>();
const tdeeStore = useTDEEStore();
const { lastInput, activityLevels, isLoading, loadLastInput, loadActivityLevels, calculate } = tdeeStore;

const result = ref<TDEEResult | null>(null);

const formData = reactive<TDEEFormData>({
  height: null,
  weight: null,
  age: null,
  gender: '',
  activity_level: ''
});

const formRules: FormRules = {
  height: [
    { required: true, message: '請輸入身高', trigger: 'blur' },
    { type: 'number', min: 50, max: 250, message: '身高範圍 50-250cm', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '請輸入體重', trigger: 'blur' },
    { type: 'number', min: 20, max: 300, message: '體重範圍 20-300kg', trigger: 'blur' }
  ],
  age: [
    { required: true, message: '請輸入年齡', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年齡範圍 1-120歲', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '請選擇性別', trigger: 'change' }
  ],
  activity_level: [
    { required: true, message: '請選擇活動等級', trigger: 'change' }
  ]
};

const handleCalculate = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    const input = {
      height: formData.height!,
      weight: formData.weight!,
      age: formData.age!,
      gender: formData.gender as 'male' | 'female',
      activity_level: formData.activity_level
    };
    
    result.value = await calculate(input);
    ElMessage.success('TDEE 計算完成');
  } catch (error: any) {
    ElMessage.error(error.message || '計算失敗');
  }
};

const handleReset = () => {
  formRef.value?.resetFields();
  result.value = null;
};

onMounted(async () => {
  await Promise.all([
    loadLastInput(),
    loadActivityLevels()
  ]);
  
  if (lastInput.value) {
    Object.assign(formData, lastInput.value);
  }
});
</script>

<style scoped>
.tdee-calculator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.calculator-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}
</style>
<template>
 <div class="bmi-calculator">
   <el-card class="calculator-card">
     <template #header>
       <h3>BMI 計算器</h3>
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
       
       <el-form-item class="form-actions">
         <el-button
           type="primary"
           @click="handleCalculate"
           :loading="isLoading"
         >
           計算 BMI
         </el-button>
         <el-button @click="handleReset">
           重置
         </el-button>
       </el-form-item>
     </el-form>
   </el-card>
   
   <BMIResultComponent v-if="result" :result="result" />
 </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useBMIStore } from '../stores/bmi';
import BMIResultComponent from './BMIResult.vue';
import type { BMIFormData } from '../types';
import type { BMIResult as BMIResultType } from '../types';

const formRef = ref<FormInstance>();
const bmiStore = useBMIStore();

const isLoading = computed(() => bmiStore.isLoading);
const lastInput = computed(() => bmiStore.lastInput);

const result = ref<BMIResultType | null>(null);

const formData = reactive<BMIFormData>({
 height: null,
 weight: null,
 age: null,
 gender: ''
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
     gender: formData.gender as 'male' | 'female'
   };
   
   result.value = await bmiStore.calculate(input);
   ElMessage.success('BMI 計算完成');
 } catch (error: any) {
   ElMessage.error(error.message || '計算失敗');
 }
};

const handleReset = () => {
 formRef.value?.resetFields();
 result.value = null;
};

onMounted(async () => {
 await bmiStore.loadLastInput();
 if (lastInput.value) {
   Object.assign(formData, lastInput.value);
 }
});
</script>

<style scoped>
.bmi-calculator {
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

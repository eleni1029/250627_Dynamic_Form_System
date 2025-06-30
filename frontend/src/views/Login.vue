<template>
 <div class="login-page">
   <div class="login-container">
     <el-card class="login-card">
       <template #header>
         <div class="login-header">
           <h2>用戶登錄</h2>
           <p>Dynamic Form System</p>
         </div>
       </template>
       
       <el-form
         ref="formRef"
         :model="formData"
         :rules="formRules"
         @submit.prevent="handleLogin"
       >
         <el-form-item prop="username">
           <el-input
             v-model="formData.username"
             placeholder="請輸入用戶名"
             size="large"
             prefix-icon="User"
           />
         </el-form-item>
         
         <el-form-item prop="password">
           <el-input
             v-model="formData.password"
             type="password"
             placeholder="請輸入密碼"
             size="large"
             prefix-icon="Lock"
             show-password
           />
         </el-form-item>
         
         <el-form-item>
           <el-button
             type="primary"
             size="large"
             style="width: 100%"
             :loading="isLoading"
             @click="handleLogin"
           >
             登錄
           </el-button>
         </el-form-item>
       </el-form>
     </el-card>
   </div>
 </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../shared/stores/auth';

const router = useRouter();
const formRef = ref<FormInstance>();
const authStore = useAuthStore();

const isLoading = computed(() => authStore.isLoading);

const formData = reactive({
 username: '',
 password: ''
});

const formRules: FormRules = {
 username: [
   { required: true, message: '請輸入用戶名', trigger: 'blur' }
 ],
 password: [
   { required: true, message: '請輸入密碼', trigger: 'blur' }
 ]
};

const handleLogin = async () => {
 if (!formRef.value) return;
 
 try {
   const valid = await formRef.value.validate();
   if (!valid) return;
   
   console.log('開始登錄流程...');
   const success = await authStore.login(formData);
   
   if (success) {
     ElMessage.success('登錄成功');
     
     // 🔧 修復：給一點時間讓專案列表同步完成
     setTimeout(() => {
       router.push('/');
     }, 100);
   } else {
     ElMessage.error('登錄失敗，請檢查用戶名和密碼');
   }
 } catch (error) {
   console.error('登錄錯誤:', error);
   ElMessage.error('登錄過程中發生錯誤');
 }
};
</script>

<style scoped>
.login-page {
 min-height: 100vh;
 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 display: flex;
 justify-content: center;
 align-items: center;
 padding: 20px;
}

.login-container {
 width: 100%;
 max-width: 400px;
}

.login-card {
 box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-header {
 text-align: center;
}

.login-header h2 {
 margin: 0 0 8px 0;
 color: #303133;
}

.login-header p {
 margin: 0;
 color: #909399;
 font-size: 14px;
}

@media (max-width: 480px) {
 .login-container {
   max-width: 100%;
 }
}
</style>

<!-- ===== frontend/src/views/Login.vue ===== -->
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../shared/stores/auth';

const router = useRouter();
const formRef = ref<FormInstance>();
const authStore = useAuthStore();
const { login, isLoading } = authStore;

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
    
    const success = await login(formData);
    if (success) {
      ElMessage.success('登錄成功');
      router.push('/');
    } else {
      ElMessage.error('登錄失敗，請檢查用戶名和密碼');
    }
  } catch (error) {
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

<!-- ===== frontend/src/router/index.ts ===== -->
<script lang="ts">
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../shared/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    }
  ]
});

// 路由守衛
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // 檢查路由是否需要認證
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登錄，重定向到登錄頁
      next('/login');
      return;
    }
  } else {
    // 不需要認證的頁面，如果已登錄則重定向到首頁
    if (authStore.isAuthenticated && to.path === '/login') {
      next('/');
      return;
    }
  }
  
  next();
});

export default router;
</script>
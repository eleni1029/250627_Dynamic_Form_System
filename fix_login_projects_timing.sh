#!/bin/bash

echo "🔧 修復登錄後專案列表時序問題"

# ===== Part 1: 修復前端 auth store =====
echo "📝 Part 1: 修復 auth store"

cat > frontend/src/shared/stores/auth.ts << 'EOF'
// ===== frontend/src/shared/stores/auth.ts =====
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../utils/http';
import type { User, ApiResponse } from '../types/common';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() => user.value?.name || '');
  const userAvatar = computed(() => user.value?.avatar_url || '');

  const login = async (credentials: { username: string; password: string }) => {
    isLoading.value = true;
    try {
      const response: ApiResponse<{ user: User }> = await httpClient.post('/auth/login', credentials);
      if (response.success && response.data) {
        user.value = response.data.user;
        
        // 🔧 修復：登錄成功後立即觸發專案列表同步
        const { useProjectStore } = await import('./project');
        const projectStore = useProjectStore();
        await projectStore.fetchUserProjects();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('登錄失敗:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await httpClient.post('/auth/logout');
      
      // 🔧 修復：登出時清理專案狀態
      const { useProjectStore } = await import('./project');
      const projectStore = useProjectStore();
      projectStore.resetState();
      
      user.value = null;
    } catch (error) {
      console.error('登出失敗:', error);
      user.value = null;
    }
  };

  const checkAuth = async () => {
    try {
      const response: ApiResponse<User> = await httpClient.get('/auth/profile');
      if (response.success && response.data) {
        user.value = response.data;
        return true;
      } else {
        user.value = null;
        return false;
      }
    } catch (error) {
      user.value = null;
      return false;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    userName,
    userAvatar,
    login,
    logout,
    checkAuth
  };
});
EOF

# ===== Part 2: 修復前端 project store =====
echo "📝 Part 2: 修復 project store"

cat > frontend/src/shared/stores/project.ts << 'EOF'
// ===== frontend/src/shared/stores/project.ts =====
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../utils/http';
import type { Project, UserProjectPermission, ApiResponse } from '../types/common';

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null);
  const userProjects = ref<UserProjectPermission[]>([]);
  const isLoading = ref(false);
  const lastFetchTime = ref<number>(0);

  const projectOptions = computed(() => {
    return userProjects.value.map(permission => ({
      value: permission.project.key,
      label: permission.project.name,
      description: permission.project.description
    }));
  });

  const hasProjects = computed(() => userProjects.value.length > 0);
  const currentProjectKey = computed(() => currentProject.value?.key || '');

  const fetchUserProjects = async (forceRefresh = false) => {
    // 🔧 修復：避免重複請求（5秒內）
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime.value) < 5000) {
      console.log('跳過重複的專案列表請求');
      return;
    }

    isLoading.value = true;
    try {
      console.log('正在獲取用戶專案列表...');
      const response: ApiResponse<UserProjectPermission[]> = await httpClient.get('/user/projects');
      
      if (response.success && response.data) {
        userProjects.value = response.data;
        lastFetchTime.value = now;
        
        console.log(`成功獲取 ${response.data.length} 個專案`);
        
        // 🔧 修復：設置默認專案
        if (userProjects.value.length > 0 && !currentProject.value) {
          currentProject.value = userProjects.value[0].project;
          console.log(`設置默認專案: ${currentProject.value.name}`);
        }
      } else {
        console.error('獲取專案列表失敗:', response.error);
        userProjects.value = [];
      }
    } catch (error) {
      console.error('獲取用戶專案失敗:', error);
      userProjects.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const switchProject = (projectKey: string) => {
    const permission = userProjects.value.find(p => p.project.key === projectKey);
    if (permission) {
      currentProject.value = permission.project;
      console.log(`切換到專案: ${permission.project.name}`);
      return true;
    }
    console.warn(`找不到專案: ${projectKey}`);
    return false;
  };

  const resetState = () => {
    currentProject.value = null;
    userProjects.value = [];
    lastFetchTime.value = 0;
    console.log('專案狀態已重置');
  };

  return {
    currentProject,
    userProjects,
    isLoading,
    projectOptions,
    hasProjects,
    currentProjectKey,
    fetchUserProjects,
    switchProject,
    resetState
  };
});
EOF

# ===== Part 3: 修復 Login.vue =====
echo "📝 Part 3: 修復 Login.vue"

cat > frontend/src/views/Login.vue << 'EOF'
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
EOF

# ===== Part 4: 修復 Home.vue =====
echo "📝 Part 4: 修復 Home.vue"

cat > frontend/src/views/Home.vue << 'EOF'
<template>
 <div class="home-page">
   <app-header />
   
   <main class="main-content">
     <div v-if="!isAuthenticated" class="login-prompt">
       <el-empty description="請先登錄使用系統">
         <el-button type="primary" @click="goToLogin">
           前往登錄
         </el-button>
       </el-empty>
     </div>
     
     <div v-else-if="isLoadingProjects" class="loading-projects">
       <el-skeleton :rows="3" animated />
       <p class="loading-text">正在載入專案列表...</p>
     </div>
     
     <div v-else-if="!hasProjects" class="no-projects">
       <el-empty description="沒有可用的專案">
         <p class="no-projects-text">
           您目前沒有任何專案的訪問權限，請聯繫系統管理員。
         </p>
         <el-button @click="refreshProjects" :loading="isLoadingProjects">
           重新載入
         </el-button>
       </el-empty>
     </div>
     
     <div v-else class="project-content">
       <component :is="currentProjectComponent" />
     </div>
   </main>
 </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../shared/stores/auth';
import { useProjectStore } from '../shared/stores/project';
import AppHeader from '../shared/components/AppHeader.vue';
import BMICalculator from '../projects/bmi/components/BMICalculator.vue';
import TDEECalculator from '../projects/tdee/components/TDEECalculator.vue';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const hasProjects = computed(() => projectStore.hasProjects);
const isLoadingProjects = computed(() => projectStore.isLoading);
const currentProjectKey = computed(() => projectStore.currentProjectKey);

const currentProjectComponent = computed(() => {
 switch (currentProjectKey.value) {
   case 'bmi':
     return BMICalculator;
   case 'tdee':
     return TDEECalculator;
   default:
     return null;
 }
});

const goToLogin = () => {
 router.push('/login');
};

const refreshProjects = async () => {
 await projectStore.fetchUserProjects(true);
};

// 🔧 修復：監聽認證狀態變化
watch(isAuthenticated, async (newValue) => {
 if (newValue && !hasProjects.value && !isLoadingProjects.value) {
   console.log('認證狀態變化，重新獲取專案列表');
   await projectStore.fetchUserProjects(true);
 }
}, { immediate: false });

onMounted(async () => {
 console.log('Home 頁面載入');
 
 // 🔧 修復：如果沒有認證，先檢查認證狀態
 if (!isAuthenticated.value) {
   console.log('檢查認證狀態...');
   const authSuccess = await authStore.checkAuth();
   
   if (authSuccess && !hasProjects.value) {
     console.log('認證成功，獲取專案列表...');
     await projectStore.fetchUserProjects(true);
   }
 } else if (!hasProjects.value && !isLoadingProjects.value) {
   // 🔧 修復：已認證但沒有專案列表時才獲取
   console.log('已認證但無專案列表，獲取專案列表...');
   await projectStore.fetchUserProjects(true);
 }
});
</script>

<style scoped>
.home-page {
 min-height: 100vh;
 background-color: #f5f7fa;
}

.main-content {
 max-width: 1200px;
 margin: 0 auto;
 padding: 20px;
 min-height: calc(100vh - 60px);
}

.login-prompt,
.no-projects,
.loading-projects {
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: center;
 min-height: 400px;
}

.loading-text {
 margin-top: 20px;
 color: #909399;
 font-size: 14px;
}

.no-projects-text {
 margin: 15px 0;
 color: #909399;
 font-size: 14px;
 text-align: center;
 line-height: 1.6;
}

.project-content {
 width: 100%;
}

@media (max-width: 768px) {
 .main-content {
   padding: 15px;
 }
}
</style>
EOF

echo "✅ 修復完成！"
echo ""
echo "🔧 修復內容："
echo "   1. auth store: 登錄成功後立即同步專案列表"
echo "   2. project store: 防止重複請求，增加緩存機制"
echo "   3. Login.vue: 登錄後延遲跳轉，確保狀態同步"
echo "   4. Home.vue: 增加載入狀態，優化認證流程"
echo ""
echo "🧪 測試步驟："
echo "   1. 重啟前端服務: cd frontend && npm run dev"
echo "   2. 打開 http://localhost:5173"
echo "   3. 登錄系統（testuser/password123）"
echo "   4. 檢查是否立即看到專案列表"
echo ""
echo "📋 如果還有問題，檢查瀏覽器控制台日誌"
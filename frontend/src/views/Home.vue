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

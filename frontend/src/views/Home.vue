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
     
     <div v-else-if="!hasProjects" class="no-projects">
       <el-empty description="沒有可用的專案">
         <p class="no-projects-text">
           您目前沒有任何專案的訪問權限，請聯繫系統管理員。
         </p>
       </el-empty>
     </div>
     
     <div v-else class="project-content">
       <component :is="currentProjectComponent" />
     </div>
   </main>
 </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
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

onMounted(async () => {
 await authStore.checkAuth();
 if (isAuthenticated.value) {
   await projectStore.fetchUserProjects();
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
.no-projects {
 display: flex;
 justify-content: center;
 align-items: center;
 min-height: 400px;
}

.no-projects-text {
 margin-top: 15px;
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

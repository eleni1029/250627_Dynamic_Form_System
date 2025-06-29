<!-- ===== frontend/src/projects/tdee/components/TDEEResult.vue ===== -->
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

<!-- ===== frontend/src/views/Home.vue ===== -->
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

const { isAuthenticated, checkAuth } = authStore;
const { hasProjects, currentProjectKey, fetchUserProjects } = projectStore;

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
  await checkAuth();
  if (isAuthenticated.value) {
    await fetchUserProjects();
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
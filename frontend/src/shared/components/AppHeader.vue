<!-- ===== frontend/src/shared/components/AppHeader.vue ===== -->
<template>
  <el-header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <h1 class="system-title">Dynamic Form System</h1>
      </div>
      <div class="header-center">
        <project-selector v-if="isAuthenticated" />
      </div>
      <div class="header-right">
        <user-menu v-if="isAuthenticated" />
        <login-button v-else />
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import ProjectSelector from './ProjectSelector.vue';
import UserMenu from './UserMenu.vue';
import LoginButton from './LoginButton.vue';

const authStore = useAuthStore();
const { isAuthenticated } = authStore;
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid #dcdfe6;
  background: #fff;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.system-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-center {
  flex: 1;
  max-width: 300px;
  margin: 0 20px;
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 15px;
  }
  .system-title {
    font-size: 16px;
  }
  .header-center {
    margin: 0 15px;
    max-width: 200px;
  }
}
</style>
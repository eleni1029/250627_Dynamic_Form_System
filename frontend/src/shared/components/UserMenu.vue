<!-- ===== frontend/src/shared/components/UserMenu.vue ===== -->
<template>
  <el-dropdown @command="handleCommand">
    <div class="user-info">
      <el-avatar :size="32" :src="userAvatar">
        <el-icon><User /></el-icon>
      </el-avatar>
      <span class="user-name">{{ userName }}</span>
      <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
    </div>
    
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="logout">
          <el-icon><SwitchButton /></el-icon>
          登出
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { User, ArrowDown, SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const authStore = useAuthStore();
const router = useRouter();
const { userName, userAvatar, logout } = authStore;

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('確定要登出嗎？', '確認登出', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      
      await logout();
      ElMessage.success('已登出');
      router.push('/login');
    } catch {
      // 用戶取消
    }
  }
};
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .user-name {
    display: none;
  }
}
</style>


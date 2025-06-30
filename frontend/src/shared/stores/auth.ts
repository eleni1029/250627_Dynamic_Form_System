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

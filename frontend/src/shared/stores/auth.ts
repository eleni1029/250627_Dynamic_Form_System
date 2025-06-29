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
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    await httpClient.post('/auth/logout');
    user.value = null;
  };

  const checkAuth = async () => {
    try {
      const response: ApiResponse<User> = await httpClient.get('/auth/profile');
      if (response.success && response.data) {
        user.value = response.data;
      }
    } catch (error) {
      user.value = null;
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
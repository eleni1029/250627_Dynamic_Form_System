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

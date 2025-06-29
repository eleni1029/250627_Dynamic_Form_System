// ===== frontend/src/shared/stores/project.ts =====
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../utils/http';
import type { Project, UserProjectPermission, ApiResponse } from '../types/common';

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null);
  const userProjects = ref<UserProjectPermission[]>([]);
  const isLoading = ref(false);

  const projectOptions = computed(() => {
    return userProjects.value.map(permission => ({
      value: permission.project.key,
      label: permission.project.name,
      description: permission.project.description
    }));
  });

  const hasProjects = computed(() => userProjects.value.length > 0);
  const currentProjectKey = computed(() => currentProject.value?.key || '');

  const fetchUserProjects = async () => {
    isLoading.value = true;
    try {
      const response: ApiResponse<UserProjectPermission[]> = await httpClient.get('/user/projects');
      if (response.success && response.data) {
        userProjects.value = response.data;
        if (userProjects.value.length > 0 && !currentProject.value) {
          currentProject.value = userProjects.value[0].project;
        }
      }
    } catch (error) {
      console.error('獲取用戶專案失敗:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const switchProject = (projectKey: string) => {
    const permission = userProjects.value.find(p => p.project.key === projectKey);
    if (permission) {
      currentProject.value = permission.project;
      return true;
    }
    return false;
  };

  const resetState = () => {
    currentProject.value = null;
    userProjects.value = [];
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
<!-- ===== frontend/src/shared/components/ProjectSelector.vue ===== -->
<template>
  <el-select
    v-model="selectedProject"
    placeholder="選擇專案"
    filterable
    clearable
    @change="handleProjectChange"
    style="width: 100%"
  >
    <el-option
      v-for="option in projectOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    >
      <div class="project-option">
        <div class="project-name">{{ option.label }}</div>
        <div class="project-desc">{{ option.description }}</div>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useProjectStore } from '../stores/project';
import { ElMessage } from 'element-plus';

const projectStore = useProjectStore();
const { currentProject, projectOptions, switchProject } = projectStore;

const selectedProject = ref<string>('');

watch(
  currentProject,
  (newProject) => {
    if (newProject) {
      selectedProject.value = newProject.key;
    }
  },
  { immediate: true }
);

const handleProjectChange = (projectKey: string) => {
  if (!projectKey) return;
  
  const success = switchProject(projectKey);
  if (success) {
    ElMessage.success(`已切換到: ${currentProject?.name}`);
  } else {
    ElMessage.error('專案切換失敗');
    selectedProject.value = currentProject?.key || '';
  }
};
</script>

<style scoped>
.project-option {
  padding: 4px 0;
}

.project-name {
  font-weight: 500;
  color: #303133;
}

.project-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
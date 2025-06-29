<!-- ===== frontend/src/shared/components/LoginButton.vue ===== -->
<template>
  <el-button type="primary" @click="goToLogin">
    登錄
  </el-button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  router.push('/login');
};
</script>
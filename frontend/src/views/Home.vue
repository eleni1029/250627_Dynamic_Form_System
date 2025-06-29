<template>
  <div class="home">
    <h1>Dynamic Form System</h1>
    <p>Vue 3 + TypeScript + Element Plus + Pinia</p>
    <el-button type="primary" @click="handleClick">測試按鈕</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const handleClick = () => {
  ElMessage.success('前端配置成功！')
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}
</style>

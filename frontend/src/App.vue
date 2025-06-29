<!-- ===== frontend/src/App.vue ===== -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 主應用組件 - 嚴格模組化架構
</script>

<style>
/* 全域樣式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

/* 響應式基礎設定 */
@media (max-width: 768px) {
  .el-card__body {
    padding: 15px !important;
  }
}
</style>
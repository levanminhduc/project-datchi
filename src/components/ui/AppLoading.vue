<template>
  <div class="fullscreen flex flex-center column app-loading-container">
    <q-spinner color="primary" size="3em" :thickness="5" />
    <div class="text-primary text-subtitle1 q-mt-md text-weight-medium">
      Đang tải hệ thống...
    </div>
  </div>
</template>

<script setup lang="ts">
// AppLoading.vue - Component chờ trong lúc khởi tạo hệ thống / đăng nhập
</script>

<style scoped>
.app-loading-container {
  background-color: #ffffff;
  z-index: 9999;
}

:global(.body--dark) .app-loading-container {
  background-color: #121212;
}
</style>

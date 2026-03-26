<template>
  <div class="sync-status row items-center">
    <q-icon
      :name="isOnline ? 'cloud_done' : 'cloud_off'"
      :color="isOnline ? 'white' : 'warning'"
      size="20px"
    />
    <q-badge
      v-if="pendingCount > 0"
      color="warning"
      floating
      rounded
    >
      {{ pendingCount }}
    </q-badge>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(navigator.onLine)
const pendingCount = ref(0)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

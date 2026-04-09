<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import AppSpinner from '@/components/ui/feedback/AppSpinner.vue'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="!isOnline"
        class="network-overlay"
      >
        <div class="network-overlay__content">
          <q-icon
            name="wifi_off"
            size="48px"
            color="grey-6"
          />
          <AppSpinner
            size="40px"
            color="primary"
          />
          <div class="text-body1 text-grey-7">
            Đang kết nối lại...
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.network-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
}

.network-overlay__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

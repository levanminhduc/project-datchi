<template>
  <div class="offline-sync-banner">
    <!-- Offline Banner -->
    <transition name="slide-down">
      <q-banner
        v-if="!isOnline"
        class="offline-banner bg-warning text-dark"
        dense
        rounded
      >
        <template #avatar>
          <q-icon
            name="wifi_off"
            color="dark"
          />
        </template>
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-weight-medium">
              Chế độ Offline
            </div>
            <div class="text-caption">
              Các thao tác sẽ được lưu và đồng bộ khi có mạng
            </div>
          </div>
          <q-badge
            v-if="pendingCount > 0"
            color="dark"
            class="q-ml-sm"
          >
            {{ pendingCount }} chờ đồng bộ
          </q-badge>
        </div>
      </q-banner>
    </transition>

    <!-- Syncing Banner -->
    <transition name="slide-down">
      <q-banner
        v-if="isOnline && isSyncing"
        class="syncing-banner bg-info text-white"
        dense
        rounded
      >
        <template #avatar>
          <q-spinner-dots
            color="white"
            size="24px"
          />
        </template>
        <div>
          <div class="text-weight-medium">
            Đang đồng bộ...
          </div>
          <div class="text-caption">
            Vui lòng chờ trong giây lát
          </div>
        </div>
      </q-banner>
    </transition>

    <!-- Pending Operations Banner (Online but has pending) -->
    <transition name="slide-down">
      <q-banner
        v-if="isOnline && !isSyncing && pendingCount > 0"
        class="pending-banner bg-blue-1 text-primary"
        dense
        rounded
      >
        <template #avatar>
          <q-icon
            name="cloud_upload"
            color="primary"
          />
        </template>
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-weight-medium">
              {{ pendingCount }} thao tác chờ đồng bộ
            </div>
          </div>
          <q-btn
            flat
            dense
            color="primary"
            label="Đồng bộ"
            icon="sync"
            :loading="isSyncing"
            @click="handleSync"
          />
        </div>
      </q-banner>
    </transition>

    <!-- Conflicts Banner -->
    <transition name="slide-down">
      <q-banner
        v-if="conflictCount > 0"
        class="conflict-banner bg-negative text-white q-mt-xs"
        dense
        rounded
      >
        <template #avatar>
          <q-icon
            name="error"
            color="white"
          />
        </template>
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-weight-medium">
              {{ conflictCount }} xung đột cần xử lý
            </div>
          </div>
          <q-btn
            flat
            dense
            color="white"
            label="Xem"
            icon="visibility"
            @click="$emit('show-conflicts')"
          />
        </div>
      </q-banner>
    </transition>

    <!-- Failed Operations Banner -->
    <transition name="slide-down">
      <q-banner
        v-if="failedCount > 0 && conflictCount === 0"
        class="failed-banner bg-orange text-white q-mt-xs"
        dense
        rounded
      >
        <template #avatar>
          <q-icon
            name="warning"
            color="white"
          />
        </template>
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-weight-medium">
              {{ failedCount }} thao tác thất bại
            </div>
            <div class="text-caption">
              Sẽ thử lại tự động
            </div>
          </div>
          <q-btn
            flat
            dense
            color="white"
            label="Thử lại"
            icon="refresh"
            @click="handleRetryAll"
          />
        </div>
      </q-banner>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOfflineQueueStore } from '@/stores/thread/offlineQueue'
import { storeToRefs } from 'pinia'

defineEmits<{
  (e: 'show-conflicts'): void
}>()

const store = useOfflineQueueStore()
const { isOnline, isSyncing, pendingCount, failedCount, conflictCount } = storeToRefs(store)

const handleSync = async () => {
  await store.sync()
}

const handleRetryAll = async () => {
  const failed = store.failedOperations
  for (const op of failed) {
    await store.retryFailed(op.id)
  }
}

onMounted(async () => {
  await store.initialize()
})

onUnmounted(() => {
  store.cleanup()
})
</script>

<style scoped>
.offline-sync-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 8px;
}

.offline-banner,
.syncing-banner,
.pending-banner,
.conflict-banner,
.failed-banner {
  margin-bottom: 4px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

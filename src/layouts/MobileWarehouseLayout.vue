<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          @click="goBack"
        />
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        
        <!-- Sync Status Indicator -->
        <SyncStatus v-if="showSyncStatus" />
        
        <q-btn
          flat
          dense
          round
          icon="more_vert"
        >
          <q-menu>
            <q-list>
              <q-item clickable v-close-popup @click="$router.push('/thread/dashboard')">
                <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
                <q-item-section>Dashboard</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="toggleDarkMode">
                <q-item-section avatar><q-icon name="dark_mode" /></q-item-section>
                <q-item-section>Chế độ tối</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Main Content -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation -->
    <q-footer elevated class="bg-white text-grey-8">
      <q-tabs
        v-model="activeTab"
        class="mobile-nav"
        active-color="primary"
        indicator-color="primary"
        switch-indicator
      >
        <q-route-tab
          name="receive"
          icon="inventory_2"
          label="Nhập Kho"
          :to="{ name: 'thread-mobile-receive' }"
        />
        <q-route-tab
          name="issue"
          icon="local_shipping"
          label="Xuất Kho"
          :to="{ name: 'thread-mobile-issue' }"
        />
        <q-route-tab
          name="recovery"
          icon="assignment_return"
          label="Hoàn Trả"
          :to="{ name: 'thread-mobile-recovery' }"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import SyncStatus from '@/components/thread/SyncStatus.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const showSyncStatus = ref(true)

const activeTab = computed(() => {
  if (route.path.includes('receive')) return 'receive'
  if (route.path.includes('issue')) return 'issue'
  if (route.path.includes('recovery')) return 'recovery'
  return 'receive'
})

const title = computed(() => {
  const titles: Record<string, string> = {
    receive: 'Nhập Kho',
    issue: 'Xuất Kho',
    recovery: 'Hoàn Trả',
  }
  return titles[activeTab.value] || 'Kho Chỉ'
})

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/thread/dashboard')
  }
}

const toggleDarkMode = () => {
  $q.dark.toggle()
}
</script>

<style scoped>
.mobile-nav :deep(.q-tab) {
  min-height: 56px;
}

.mobile-nav :deep(.q-tab__icon) {
  font-size: 24px;
}

.mobile-nav :deep(.q-tab__label) {
  font-size: 12px;
  margin-top: 4px;
}
</style>

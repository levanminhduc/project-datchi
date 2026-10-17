<script lang="ts" setup>
import { onMounted, computed, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DarkModeToggle from "./components/DarkModeToggle.vue";
import ChangePasswordModal from "./components/auth/ChangePasswordModal.vue";
import { useDarkMode } from "./composables/useDarkMode";
import { useSidebar } from "./composables/useSidebar";
import { useNotifications } from "./composables/useNotifications";
import { useAuth } from "./composables/useAuth";
import { useVersionCheck } from "./composables/useVersionCheck";
import AnnouncementPopup from './components/ui/AnnouncementPopup.vue'
import ApprovedOrdersPopup from './components/notifications/ApprovedOrdersPopup.vue'
import type { Notification } from '@/types/notification'
import type { NavItem } from '@/types/navigation'
import { useLeaderPendingCount } from './composables/thread/use-leader-pending-count'
import NetworkStatusBanner from './components/ui/feedback/NetworkStatusBanner.vue'
import AppLoading from './components/ui/AppLoading.vue'
import { useAnnouncements } from './composables/use-announcements'
import { initNetworkStatus } from './composables/useNetworkStatus'
import FloatingChatAssistant from './components/thread/FloatingChatAssistant.vue'

const route = useRoute();
const router = useRouter();
const { init: initDarkMode } = useDarkMode();
const { isOpen, navItems, toggle } = useSidebar();
const { notifications, startPolling, stopPolling } = useNotifications();
const { isAuthenticated, tempPassword, isLoading, hasPermission } = useAuth();
const {
  pendingCount: leaderPendingCount,
  startPolling: startLeaderPendingPolling,
  stopPolling: stopLeaderPendingPolling,
} = useLeaderPendingCount();
const { startVersionCheck, stopVersionCheck } = useVersionCheck();
const {
  currentAnnouncement,
  totalPending,
  currentPosition,
  fetchPending: fetchAnnouncements,
  dismissCurrent: dismissAnnouncement,
} = useAnnouncements()

const KEEP_ALIVE_PATHS = new Set([
  '/thread',
  '/thread/inventory',
  '/thread/allocations',
  '/thread/colors',
  '/thread/suppliers',
  '/thread/dashboard',
  '/thread/styles',
  '/employees',
])

const shouldKeepAlive = computed(() => KEEP_ALIVE_PATHS.has(route.path))

// TODO: bật lại khi cần force đổi mật khẩu lần đầu
const showChangePasswordModal = computed(() => false);

function onPasswordChanged() {
  if (route.path === "/login") {
    router.push("/");
  }
}

const isPublicPage = computed(() => route.path.startsWith('/g/'))
const showSidebar = computed(() => route.path !== "/login" && !isPublicPage.value && isAuthenticated.value);
const showFloatingChatAssistant = computed(() =>
  showSidebar.value
  && route.path !== '/thread/chat-assistant'
  && hasPermission('chat.assistant.use')
)

const LEADER_REVIEW_PATH = '/thread/weekly-order/leader-review'

const canLeaderSign = computed(() => showSidebar.value && hasPermission('thread.leader.sign'))

const sidebarItems = computed<NavItem[]>(() =>
  navItems.map(item => ({
    ...item,
    children: item.children?.map(child =>
      child.to === LEADER_REVIEW_PATH && leaderPendingCount.value > 0
        ? { ...child, badge: leaderPendingCount.value }
        : child
    ),
  }))
)

watch(canLeaderSign, (can) => {
  if (can) {
    startLeaderPendingPolling()
  } else {
    stopLeaderPendingPolling()
  }
}, { immediate: true })

const approvedPopupOpen = ref(false)
const dismissedApprovedThisSession = ref(false)

const unreadApprovedOrders = computed<Notification[]>(() =>
  notifications.value.filter(n => n.type === 'ORDER_APPROVED' && !n.is_read)
)

watch(unreadApprovedOrders, (list) => {
  if (list.length > 0 && !dismissedApprovedThisSession.value && showSidebar.value) {
    approvedPopupOpen.value = true
  }
})

function onApprovedDismiss() {
  dismissedApprovedThisSession.value = true
}

watch(showSidebar, (show) => {
  if (show) {
    startPolling()
    startVersionCheck()
    fetchAnnouncements()
  } else {
    stopPolling()
    stopVersionCheck()
  }
}, { immediate: true })

onMounted(() => {
  initDarkMode();
  initNetworkStatus();
});
</script>

<template>
  <AppLoading v-if="isLoading && route.path !== '/login'" />
  <q-layout
    v-else
    view="hHh Lpr fFf"
  >
    <q-header
      elevated
      class="bg-primary text-white"
    >
      <q-toolbar>
        <q-btn
          v-if="showSidebar"
          flat
          round
          dense
          icon="menu"
          @click="toggle"
        />
        <q-toolbar-title> Hòa Thọ Điện Bàn </q-toolbar-title>
        <NotificationBell v-if="showSidebar" />
        <DarkModeToggle v-if="!isPublicPage || isAuthenticated" />
        <UserMenu v-if="!isPublicPage || isAuthenticated" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="showSidebar"
      v-model="isOpen"
      side="left"
      bordered
      :width="280"
      class="sidebar"
    >
      <q-scroll-area class="fit">
        <q-list>
          <SidebarItem
            v-for="item in sidebarItems"
            :key="item.label"
            :item="item"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <NetworkStatusBanner />
      <router-view v-slot="{ Component }">
        <keep-alive
          v-if="shouldKeepAlive"
          :max="10"
        >
          <component
            :is="Component"
            :key="route.path"
          />
        </keep-alive>
        <component
          :is="Component"
          v-else
          :key="route.path"
        />
      </router-view>
    </q-page-container>

    <ChangePasswordModal
      :model-value="showChangePasswordModal"
      :current-password="tempPassword"
      @changed="onPasswordChanged"
    />

    <AnnouncementPopup
      v-if="currentAnnouncement"
      :announcement="currentAnnouncement"
      :current="currentPosition"
      :total="totalPending"
      @dismiss="dismissAnnouncement"
    />

    <ApprovedOrdersPopup
      v-model="approvedPopupOpen"
      :orders="unreadApprovedOrders"
      @dismiss="onApprovedDismiss"
    />

    <FloatingChatAssistant v-if="showFloatingChatAssistant" />
  </q-layout>
</template>


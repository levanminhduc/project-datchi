<script lang="ts" setup>
import { onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DarkModeToggle from "./components/DarkModeToggle.vue";
import ChangePasswordModal from "./components/auth/ChangePasswordModal.vue";
import { useDarkMode } from "./composables/useDarkMode";
import { useSidebar } from "./composables/useSidebar";
import { useNotifications } from "./composables/useNotifications";
import { useAuth } from "./composables/useAuth";
import { useVersionCheck } from "./composables/useVersionCheck";

const route = useRoute();
const router = useRouter();
const { init: initDarkMode } = useDarkMode();
const { isOpen, navItems, toggle } = useSidebar();
const { startPolling, stopPolling } = useNotifications();
const { isAuthenticated, tempPassword } = useAuth();
const { startVersionCheck, stopVersionCheck } = useVersionCheck();

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

watch(showSidebar, (show) => {
  if (show) {
    startPolling()
    startVersionCheck()
  } else {
    stopPolling()
    stopVersionCheck()
  }
}, { immediate: true })

onMounted(() => {
  initDarkMode();
});
</script>

<template>
  <q-layout
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
            v-for="item in navItems"
            :key="item.label"
            :item="item"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
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
  </q-layout>
</template>

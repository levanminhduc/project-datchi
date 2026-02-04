<script lang="ts" setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import DarkModeToggle from './components/DarkModeToggle.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useSidebar } from './composables/useSidebar'

const route = useRoute()
const { init: initDarkMode } = useDarkMode()
const { isOpen, navItems, toggle } = useSidebar()

// Hide sidebar on login page
const showSidebar = computed(() => route.path !== '/login')

onMounted(() => {
  // Initialize dark mode preference
  initDarkMode()
  
  // Note: Auth is initialized in router guards (beforeEach)
  // to ensure proper auth state before any navigation
})
</script>

<template>
  <q-layout view="hHh Lpr fFf">
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
        <q-toolbar-title>
          App Title
        </q-toolbar-title>
        <DarkModeToggle />
        <UserMenu />
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
      <router-view />
    </q-page-container>
  </q-layout>
</template>

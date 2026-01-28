<script lang="ts" setup>
import { onMounted } from 'vue'
import DarkModeToggle from './components/DarkModeToggle.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useSidebar } from './composables/useSidebar'

const { init } = useDarkMode()
const { isOpen, navItems, toggle } = useSidebar()

onMounted(() => {
  init()
})
</script>

<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="toggle" />
        <q-toolbar-title>
          App Title
        </q-toolbar-title>
        <DarkModeToggle />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="isOpen"
      side="left"
      bordered
      :width="280"
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

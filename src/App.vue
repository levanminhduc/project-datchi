<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DarkModeToggle from './components/DarkModeToggle.vue'
import AppDrawer from './components/ui/layout/AppDrawer.vue'
import AppList from './components/ui/lists/AppList.vue'
import ListItem from './components/ui/lists/ListItem.vue'
import { useDarkMode } from './composables/useDarkMode'

const { init } = useDarkMode()
const route = useRoute()
const drawerOpen = ref(true)

const menuItems = [
  { label: 'Trang Chủ', icon: 'home', to: '/' },
  { label: 'Nhân Sự', icon: 'people', to: '/nhan-su' },
  { label: 'Kế Hoạch', icon: 'event_note', to: '/ke-hoach' },
  { label: 'Kỹ Thuật', icon: 'engineering', to: '/ky-thuat' },
  { label: 'Kho', icon: 'inventory_2', to: '/kho' },
  { label: 'Phân Quyền', icon: 'admin_panel_settings', to: '/phan-quyen' }
]

onMounted(() => {
  init()
})
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawerOpen = !drawerOpen" />
        <q-toolbar-title>
          App Title
        </q-toolbar-title>
        <DarkModeToggle />
      </q-toolbar>
    </q-header>

    <AppDrawer v-model="drawerOpen" :width="280" bordered>
      <div class="q-pa-md">
        <div class="text-h6 text-primary text-weight-bold">Menu</div>
      </div>
      <AppList padding>
        <ListItem
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          clickable
          v-ripple
          :active="route.path === item.to"
          class="rounded-borders q-mb-xs"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </ListItem>
      </AppList>
    </AppDrawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

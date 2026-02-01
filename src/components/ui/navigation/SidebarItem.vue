<script setup lang="ts">
/**
 * SidebarItem - Recursive sidebar navigation item
 * Renders either a simple q-item or a q-expansion-item for nested menus
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { NavItem } from '@/types/navigation'

interface Props {
  item: NavItem
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

const route = useRoute()

const isRouteActive = (item: NavItem): boolean => {
  if (!item.to) return false

  const itemPath = item.to.replace('#top', '')

  // Exact match only - handles both '/thread' and '/thread/'
  return route.path === itemPath || route.path === itemPath + '/'
}

// Local expansion state - avoids reactivity cascade from computed
const expanded = ref(false)

// Only expand when navigating TO a child route, not on every route change
watch(
  () => route.path,
  (newPath) => {
    if (!props.item.children) return
    const hasActiveChild = props.item.children.some((child) => {
      if (!child.to) return false
      const childPath = child.to.replace('#top', '')
      return newPath === childPath || newPath === childPath + '/'
    })
    if (hasActiveChild) {
      expanded.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <!-- Render nested menu if children exist -->
  <q-expansion-item
    v-if="item.children?.length"
    v-model="expanded"
    :icon="item.icon"
    :label="item.label"
    :default-opened="false"
    :header-inset-level="level"
    :header-class="expanded ? 'sidebar-item--active' : 'sidebar-item'"
    :duration="0"
    :ripple="false"
    expand-separator
  >
    <SidebarItem
      v-for="child in item.children"
      :key="child.label"
      :item="child"
      :level="level + 0.5"
    />
  </q-expansion-item>

  <!-- Render leaf item -->
  <q-item
    v-else
    v-ripple
    clickable
    :to="item.to"
    :active="isRouteActive(item)"
    active-class="sidebar-item--active"
    :inset-level="level"
    class="sidebar-item"
    :class="{ 'sidebar-item--nested': level > 0 }"
  >
    <q-item-section
      v-if="item.icon"
      avatar
    >
      <q-icon :name="item.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ item.label }}</q-item-label>
    </q-item-section>

    <q-item-section
      v-if="item.badge"
      side
    >
      <q-badge
        :color="item.badgeColor || 'red'"
        :label="item.badge"
      />
    </q-item-section>
  </q-item>
</template>

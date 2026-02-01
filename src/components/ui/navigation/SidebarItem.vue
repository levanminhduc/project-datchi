<script setup lang="ts">
/**
 * SidebarItem - Recursive sidebar navigation item
 * Renders either a simple q-item or a q-expansion-item for nested menus
 */
import { computed } from 'vue'
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

const isChildActive = computed(() => {
  if (!props.item.children) return false
  return props.item.children.some(child => isRouteActive(child))
})

const isExpanded = computed(() => {
  return isChildActive.value
})
</script>

<template>
  <!-- Render nested menu if children exist -->
  <q-expansion-item
    v-if="item.children?.length"
    :model-value="isExpanded"
    :icon="item.icon"
    :label="item.label"
    :default-opened="false"
    :header-inset-level="level"
    :header-class="isExpanded ? 'sidebar-item--active' : 'sidebar-item'"
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

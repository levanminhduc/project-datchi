<script setup lang="ts">
/**
 * AppBreadcrumbs - Breadcrumb navigation wrapper
 * Wraps QBreadcrumbs with items array support
 */
import type { Color } from '@/types/ui'

interface BreadcrumbItem {
  label: string
  icon?: string
  to?: string
  href?: string
  disable?: boolean
}

interface Props {
  items?: BreadcrumbItem[]
  separator?: string
  separatorColor?: Color
  activeColor?: Color
  gutter?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  separator: '/',
  gutter: 'sm',
  activeColor: 'primary'
})
</script>

<template>
  <q-breadcrumbs
    :separator="separator"
    :separator-color="separatorColor"
    :active-color="activeColor"
    :gutter="gutter"
  >
    <q-breadcrumbs-el
      v-for="(item, index) in items"
      :key="index"
      :label="item.label"
      :icon="item.icon"
      :to="item.to"
      :href="item.href"
      :disable="item.disable"
    />
    <slot />
  </q-breadcrumbs>
</template>

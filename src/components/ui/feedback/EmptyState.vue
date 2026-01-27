<template>
  <div class="empty-state column items-center q-py-xl" v-bind="$attrs">
    <q-icon
      :name="icon"
      :size="iconSize"
      :color="iconColor"
      class="q-mb-md"
    />
    <div v-if="title" class="text-h6 text-grey-6 q-mb-sm text-center">
      {{ title }}
    </div>
    <div v-if="subtitle" class="text-body2 text-grey-5 text-center q-mb-md">
      {{ subtitle }}
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { EmptyStateProps } from '@/types/ui'

defineOptions({
  inheritAttrs: false,
})

withDefaults(defineProps<EmptyStateProps>(), {
  icon: 'inbox',
  iconSize: '64px',
  iconColor: 'grey-5',
  title: 'Không có dữ liệu',
})
</script>

<style scoped>
.empty-state {
  width: 100%;
  min-height: 200px;
}
</style>

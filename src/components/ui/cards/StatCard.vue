<template>
  <q-card
    v-bind="$attrs"
    :flat="flat"
    :bordered="bordered"
    class="stat-card"
  >
    <q-card-section>
      <div class="row items-center justify-between">
        <div>
          <div class="text-caption text-grey text-uppercase">{{ label }}</div>
          <div class="text-h4 text-weight-bold q-mt-xs">{{ value }}</div>
          <div v-if="trend" class="q-mt-sm">
            <q-badge
              :color="trendPositive ? 'positive' : 'negative'"
              :label="trend"
              class="text-weight-medium"
            />
          </div>
        </div>
        <q-avatar
          v-if="icon"
          :color="iconBgColor"
          :text-color="iconColor"
          :icon="icon"
          size="56px"
        />
      </div>
    </q-card-section>
    <slot />
  </q-card>
</template>

<script setup lang="ts">
import type { StatCardProps } from '@/types/ui'

withDefaults(defineProps<StatCardProps>(), {
  iconColor: 'white',
  iconBgColor: 'primary',
  trendPositive: true,
  flat: false,
  bordered: true,
})
</script>

<style scoped>
.stat-card {
  min-width: 200px;
}
</style>

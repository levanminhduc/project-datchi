<template>
  <q-card
    v-bind="$attrs"
    :flat="flat"
    :bordered="bordered"
    class="info-card"
  >
    <q-card-section>
      <div class="row items-center no-wrap">
        <q-avatar
          v-if="icon"
          :color="iconColor"
          text-color="white"
          :icon="icon"
        />
        <div class="q-ml-md">
          <div
            v-if="title"
            class="text-subtitle1 text-weight-medium"
          >
            {{ title }}
          </div>
          <div
            v-if="subtitle"
            class="text-caption text-grey"
          >
            {{ subtitle }}
          </div>
        </div>
      </div>
    </q-card-section>
    <slot />
  </q-card>
</template>

<script setup lang="ts">
import type { InfoCardProps } from '@/types/ui'

withDefaults(defineProps<InfoCardProps>(), {
  iconColor: 'primary',
  flat: false,
  bordered: true,
})
</script>

<style scoped>
.info-card {
  transition: box-shadow 0.2s ease;
}
</style>

<template>
  <q-btn
    flat
    round
    dense
    :icon="iconName"
    @click="toggle"
  >
    <q-tooltip>{{ preference }} mode</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { preference, toggle } = useDarkMode()

const iconName = computed(() => {
  if (preference.value === 'dark') return 'dark_mode'
  if (preference.value === 'light') return 'light_mode'
  return 'brightness_auto'
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    persistent
  >
    <q-card style="min-width: min(420px, 80vw)">
      <q-card-section>
        <div class="text-h6">
          Đang xuất Excel
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body2 q-mb-sm">
          Đang xử lý {{ current }}/{{ total }}: <b>{{ currentName }}</b>
        </div>
        <q-linear-progress
          :value="total > 0 ? current / total : 0"
          color="primary"
          size="10px"
          rounded
        />
        <div class="text-caption text-grey-7 q-mt-xs">
          {{ Math.round((total > 0 ? current / total : 0) * 100) }}%
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  current: number
  total: number
  currentName: string
}>()
</script>

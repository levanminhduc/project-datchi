<script setup lang="ts">
import { computed } from 'vue'
import type { Announcement } from '@/types/announcement'

interface Props {
  announcement: Announcement
  current: number
  total: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  dismiss: []
}>()

const showDialog = computed(() => !!props.announcement)

const counterText = computed(() =>
  props.total > 1 ? `${props.current}/${props.total}` : ''
)
</script>

<template>
  <q-dialog
    :model-value="showDialog"
    persistent
    no-backdrop-dismiss
  >
    <q-card style="max-width: 500px; width: 100%;">
      <q-card-section class="row items-center q-pb-none">
        <q-icon
          name="campaign"
          size="24px"
          color="primary"
          class="q-mr-sm"
        />
        <div class="text-h6">
          {{ announcement.title }}
        </div>
        <q-badge
          v-if="counterText"
          color="primary"
          :label="counterText"
          class="q-ml-sm"
        />
        <q-space />
      </q-card-section>

      <q-card-section class="q-pt-md announcement-body">
        <div v-html="announcement.content" />
      </q-card-section>

      <q-card-actions
        align="right"
        class="text-primary q-pa-md"
      >
        <q-btn
          unelevated
          color="primary"
          label="Đã hiểu"
          :loading="loading"
          @click="emit('dismiss')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.announcement-body {
  font-size: 14px;
  line-height: 1.7;

  :deep(b), :deep(strong) {
    font-weight: 600;
  }

  :deep(ul), :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }
}
</style>

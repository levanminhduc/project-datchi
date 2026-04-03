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
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card
      class="announcement-popup"
      style="width: 100%; max-width: 500px;"
    >
      <q-card-section class="announcement-popup__header bg-primary text-white">
        <div class="row items-center no-wrap">
          <q-icon
            name="campaign"
            size="24px"
            class="q-mr-sm"
          />
          <div class="col">
            <div class="text-caption text-uppercase" style="opacity: 0.8; letter-spacing: 1px;">
              Thông báo
            </div>
            <div class="text-subtitle1 text-weight-bold">
              {{ announcement.title }}
            </div>
          </div>
          <q-badge
            v-if="counterText"
            color="white"
            text-color="primary"
            :label="counterText"
            class="q-ml-sm"
          />
        </div>
      </q-card-section>

      <q-card-section
        class="announcement-popup__body"
        v-html="announcement.content"
      />

      <q-card-actions align="right" class="q-px-md q-pb-md">
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
.announcement-popup {
  border-radius: 12px;
  overflow: hidden;

  &__header {
    padding: 16px 20px;
  }

  &__body {
    padding: 20px;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.8);

    :deep(b), :deep(strong) {
      font-weight: 600;
    }

    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin: 8px 0;
    }
  }
}

.body--dark .announcement-popup__body {
  color: rgba(255, 255, 255, 0.85);
}

@media (max-width: 599px) {
  .announcement-popup {
    margin: 8px;
  }
}
</style>

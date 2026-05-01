<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitize-html'

interface Props {
  html: string
}

const props = defineProps<Props>()

const safeHtml = computed(() => sanitizeHtml(props.html))
</script>

<template>
  <div class="guide-preview">
    <div class="text-subtitle2 text-grey q-mb-sm row items-center q-gutter-x-xs">
      <q-icon
        name="visibility"
        size="18px"
      />
      <span>Xem trước</span>
    </div>
    <q-separator class="q-mb-md" />
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="guide-prose"
      v-html="safeHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
    <div
      v-if="!html"
      class="text-grey text-center q-pa-lg"
    >
      Nội dung xem trước sẽ hiển thị ở đây...
    </div>
  </div>
</template>

<style scoped lang="scss">
.guide-preview {
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 1rem;
  height: 100%;
}

.body--dark .guide-preview {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>

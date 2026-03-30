<script setup lang="ts">
interface Props {
  html: string
}

defineProps<Props>()
</script>

<template>
  <div class="guide-preview">
    <div class="text-subtitle2 text-grey q-mb-sm row items-center q-gutter-x-xs">
      <q-icon name="visibility" size="18px" />
      <span>Xem trước</span>
    </div>
    <q-separator class="q-mb-md" />
    <div
      class="guide-prose"
      v-html="html"
    />
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
  margin-top: 1rem;
}

.body--dark .guide-preview {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>

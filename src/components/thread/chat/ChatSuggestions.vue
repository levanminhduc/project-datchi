<template>
  <div
    v-if="visibleSuggestions.length > 0"
    class="chat-suggestions"
    :class="{ 'is-row': isRow }"
  >
    <p class="chat-suggestions__label">
      {{ label }}
    </p>
    <div
      ref="rowEl"
      class="chat-suggestions__row"
      @wheel="isRow && onWheel($event)"
      @pointerdown="isRow && onPointerDown($event)"
      @click.capture="isRow && onClickCapture($event)"
    >
      <AppButton
        v-for="suggestion in visibleSuggestions"
        :key="suggestion"
        :label="suggestion"
        variant="outlined"
        no-caps
        align="left"
        @click="emit('select', suggestion)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useDragScroll } from '@/composables/thread/use-drag-scroll'

const MAX_SUGGESTIONS = 3

const props = withDefaults(
  defineProps<{
    suggestions: string[]
    variant?: 'starter' | 'followup'
  }>(),
  { variant: 'followup' },
)

const emit = defineEmits<{
  select: [question: string]
}>()

const rowEl = ref<HTMLElement | null>(null)
const { onWheel, onPointerDown, onClickCapture } = useDragScroll(rowEl)

const isRow = computed(() => props.variant === 'followup')
const label = computed(() => (props.variant === 'starter' ? 'Thử hỏi' : 'Hỏi tiếp'))
const visibleSuggestions = computed(() => props.suggestions.slice(0, MAX_SUGGESTIONS))
</script>

<style scoped lang="scss">
.chat-suggestions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
}

.chat-suggestions__label {
  margin: 0;
  color: var(--chat-muted);
  font-size: 13px;
}

.chat-suggestions__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
}

.is-row {
  align-items: stretch;

  .chat-suggestions__row {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
    user-select: none;
  }

  .chat-suggestions__row :deep(.q-btn) {
    flex: 0 0 auto;
    max-width: none;

    .q-btn__content {
      flex-wrap: nowrap;
      white-space: nowrap;
    }
  }
}

.chat-suggestions :deep(.q-btn) {
  max-width: 100%;
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 12px;
  color: inherit !important;
  line-height: 1.4;

  &::before {
    border-color: var(--chat-border);
  }

  &:hover {
    background: var(--chat-hover);
  }

  .q-btn__content {
    flex-wrap: wrap;
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>

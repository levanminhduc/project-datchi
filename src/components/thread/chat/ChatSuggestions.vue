<template>
  <div
    v-if="visibleSuggestions.length > 0"
    class="chat-suggestions"
  >
    <p class="chat-suggestions__label">
      {{ label }}
    </p>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

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

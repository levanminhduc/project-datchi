<template>
  <form
    ref="formEl"
    class="chat-composer"
    @submit.prevent="submit"
  >
    <div class="chat-composer__shell">
      <div class="chat-composer__input">
        <AppInput
          v-model="draft"
          type="textarea"
          placeholder="Hỏi về tồn kho, mã hàng, đơn hàng…"
          aria-label="Câu hỏi cho trợ lý Chỉ AI"
          autogrow
          borderless
          dense
          hide-bottom-space
          :outlined="false"
          @keydown="onKeydown"
        />
      </div>
      <AppButton
        type="submit"
        icon="arrow_upward"
        round
        aria-label="Gửi câu hỏi"
        :disable="!canSend"
      >
        <q-tooltip>Gửi</q-tooltip>
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'

const props = withDefaults(
  defineProps<{
    busy?: boolean
  }>(),
  { busy: false },
)

const emit = defineEmits<{
  send: [question: string]
}>()

const formEl = ref<HTMLElement | null>(null)
const draft = ref('')

const canSend = computed(() => draft.value.trim().length > 0 && !props.busy)

function focus() {
  formEl.value?.querySelector('textarea')?.focus()
}

function submit() {
  if (!canSend.value) return
  emit('send', draft.value.trim())
  draft.value = ''
  focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  submit()
}

defineExpose({ focus })
</script>

<style scoped lang="scss">
.chat-composer {
  margin: 0;
}

.chat-composer__shell {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 12px;
  border: 1px solid var(--chat-border);
  border-radius: 24px;
  background: var(--chat-surface);

  &:focus-within {
    border-color: var(--q-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--q-primary) 25%, transparent);
  }
}

.chat-composer__input {
  flex: 1;
  min-width: 0;

  :deep(.q-field) {
    width: 100%;
  }

  :deep(.q-field__control) {
    padding: 0;
  }

  :deep(.q-field__control::before),
  :deep(.q-field__control::after) {
    display: none;
  }

  :deep(.q-field__native) {
    max-height: 9em;
    padding: 8px 0;
    overflow-y: auto;
    font-size: 15px;
    line-height: 1.5;
    resize: none;

    &::placeholder {
      color: var(--chat-muted);
      opacity: 1;
    }
  }
}

.chat-composer__shell > :deep(.q-btn) {
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .chat-composer__input :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>

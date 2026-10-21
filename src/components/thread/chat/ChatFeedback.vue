<template>
  <span class="chat-feedback">
    <span :class="{ 'is-up': state.rating === 'up' }">
      <AppButton
        icon="thumb_up"
        variant="text"
        size="sm"
        round
        dense
        aria-label="Câu trả lời hữu ích"
        :aria-pressed="state.rating === 'up'"
        :disable="state.phase !== 'idle' && state.rating !== 'up'"
        @click="feedback.rate(requestId, 'up')"
      >
        <q-tooltip>Hữu ích</q-tooltip>
      </AppButton>
    </span>
    <span :class="{ 'is-down': state.rating === 'down' }">
      <AppButton
        icon="thumb_down"
        variant="text"
        size="sm"
        round
        dense
        aria-label="Câu trả lời chưa đúng"
        :aria-pressed="state.rating === 'down'"
        :disable="state.phase !== 'idle' && state.rating !== 'down'"
        @click="feedback.rate(requestId, 'down')"
      >
        <q-tooltip>Chưa đúng</q-tooltip>
      </AppButton>
    </span>
    <span
      v-if="state.phase === 'sent'"
      class="chat-feedback__thanks"
      role="status"
    >
      Cảm ơn bạn
    </span>
  </span>
  <form
    v-if="state.phase === 'comment' || (state.phase === 'sending' && state.rating === 'down')"
    class="chat-feedback__form"
    @submit.prevent="feedback.submit(requestId)"
  >
    <AppInput
      :model-value="state.comment"
      placeholder="Sai ở đâu? (không bắt buộc)"
      aria-label="Góp ý cho câu trả lời"
      :maxlength="500"
      outlined
      dense
      hide-bottom-space
      autofocus
      :disable="sending"
      @update:model-value="feedback.setComment(requestId, String($event ?? ''))"
    />
    <div class="chat-feedback__buttons">
      <AppButton
        type="submit"
        label="Gửi"
        size="sm"
        :loading="sending"
        :disable="sending"
      />
      <AppButton
        label="Bỏ qua"
        variant="text"
        size="sm"
        :disable="sending"
        @click="feedback.skip(requestId)"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { useChatFeedback } from '@/composables/thread/use-chat-feedback'

const props = defineProps<{
  requestId: string
}>()

const feedback = useChatFeedback()
const state = computed(() => feedback.stateOf(props.requestId))
const sending = computed(() => state.value.phase === 'sending')
</script>

<style scoped lang="scss">
.chat-feedback {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.chat-feedback .is-up :deep(.q-btn) {
  color: var(--q-positive);
}

.chat-feedback .is-down :deep(.q-btn) {
  color: var(--q-negative);
}

.chat-feedback__thanks {
  margin-left: 4px;
  color: var(--chat-muted);
  font-size: 12px;
}

.chat-feedback__form {
  display: flex;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  order: 10;
  margin: 2px 0 6px 6px;
  max-width: 420px;

  :deep(.q-field) {
    flex: 1 1 200px;
    min-width: 0;
  }
}

.chat-feedback__buttons {
  display: flex;
  gap: 4px;
}
</style>

<template>
  <div
    class="chat-conversation"
    :class="{ 'is-compact': compact }"
  >
    <ChatMessageList
      :messages="messages"
      :compact="compact"
      @retry="retry"
    >
      <ChatSuggestions
        v-if="lastSuggestions.length > 0"
        :suggestions="lastSuggestions"
        variant="followup"
        @select="handleSend"
      />
    </ChatMessageList>

    <div class="chat-conversation__footer">
      <ChatSuggestions
        v-if="messages.length === 0"
        :suggestions="STARTER_QUESTIONS"
        variant="starter"
        @select="handleSend"
      />
      <ChatComposer
        ref="composerRef"
        :busy="loading"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatAssistant } from '@/composables/thread/use-chat-assistant'
import { STARTER_QUESTIONS } from '@/components/thread/chat-assistant-messages'
import ChatComposer from './ChatComposer.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatSuggestions from './ChatSuggestions.vue'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false },
)

const { messages, loading, lastSuggestions, send, retry } = useChatAssistant()

const composerRef = ref<InstanceType<typeof ChatComposer> | null>(null)

function focusComposer() {
  composerRef.value?.focus()
}

function handleSend(question: string) {
  void send(question)
  focusComposer()
}

defineExpose({ focusComposer })
</script>

<style scoped lang="scss">
.chat-conversation {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 15px;

  &.is-compact {
    font-size: 14px;
  }
}

.chat-conversation__footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 16px 16px;
}

.is-compact .chat-conversation__footer {
  padding: 8px 12px 12px;
}
</style>

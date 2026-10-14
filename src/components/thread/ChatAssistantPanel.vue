<template>
  <div class="chat-assistant chat-assistant-panel">
    <AppCard
      flat
      bordered
    >
      <ChatConversation />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import AppCard from '@/components/ui/cards/AppCard.vue'
import ChatConversation from '@/components/thread/chat/ChatConversation.vue'
</script>

<style scoped lang="scss">
.chat-assistant-panel {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

.chat-assistant-panel :deep(.q-card) {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 190px);
  min-height: 420px;
  min-width: 0;
  overflow: hidden;
  background: var(--chat-surface);
  border-color: var(--chat-border);
}

@media (max-width: 599px) {
  .chat-assistant-panel :deep(.q-card) {
    height: calc(100dvh - 170px);
  }
}
</style>

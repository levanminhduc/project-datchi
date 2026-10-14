<template>
  <q-page padding>
    <div class="chat-page-header q-mb-md">
      <div class="chat-page-heading">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Trợ lý tra cứu chỉ
        </h1>
        <div class="chat-page-subtitle text-caption">
          Tồn kho khả dụng và mã hàng đang khai báo định mức
        </div>
      </div>
      <AppButton
        label="Cuộc trò chuyện mới"
        icon="add"
        variant="outlined"
        @click="reset"
      />
    </div>

    <ChatAssistantPanel />
  </q-page>
</template>

<script setup lang="ts">
import ChatAssistantPanel from '@/components/thread/ChatAssistantPanel.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useChatAssistant } from '@/composables/thread/use-chat-assistant'

const { reset } = useChatAssistant()

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['chat.assistant.use'],
    title: 'Trợ lý tra cứu chỉ',
  },
})
</script>

<style scoped lang="scss">
.chat-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 820px;
  margin-left: auto;
  margin-right: auto;
}

.chat-page-heading {
  min-width: 0;
}

.chat-page-subtitle {
  color: #616161;
}

@media (max-width: 599px) {
  .chat-page-header :deep(.q-btn) {
    width: 100%;
  }
}
</style>

<style lang="scss">
.body--dark .chat-page-subtitle {
  color: #bdbdbd;
}
</style>

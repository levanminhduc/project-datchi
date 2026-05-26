<template>
  <q-page padding>
    <div class="q-mb-md">
      <h1 class="text-h5 q-my-none text-weight-bold text-primary">
        Trợ lý tra cứu chỉ
      </h1>
      <div class="text-caption text-grey-7">
        Tồn kho khả dụng và mã hàng đang khai báo định mức
      </div>
    </div>

    <ChatAssistantPanel />
  </q-page>
</template>

<script setup lang="ts">
import ChatAssistantPanel from '@/components/thread/ChatAssistantPanel.vue'

definePage({
  meta: {
    requiresAuth: true,
    allPermissions: ['thread.inventory.view', 'thread.styles.view'],
    title: 'Trợ lý tra cứu chỉ',
  },
})
</script>

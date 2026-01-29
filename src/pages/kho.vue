<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Kho"
      subtitle="Quản lý nhập xuất và tồn kho"
    />
    
    <AppCard class="q-mt-md">
      <!-- TODO: thread-management-51 Replace EmptyState with thread management quick links -->
      <EmptyState
        icon="inventory_2"
        title="Chưa có dữ liệu"
        description="Chức năng quản lý kho đang được phát triển"
      />
    </AppCard>
  </q-page>
</template>

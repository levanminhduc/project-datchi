<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Kế Hoạch"
      subtitle="Quản lý kế hoạch và tiến độ dự án"
    />
    
    <AppCard class="q-mt-md">
      <EmptyState
        icon="event_note"
        title="Chưa có dữ liệu"
        description="Chức năng quản lý kế hoạch đang được phát triển"
      />
    </AppCard>
  </q-page>
</template>

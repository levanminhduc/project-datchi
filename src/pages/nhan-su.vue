<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Nhân Sự"
      subtitle="Quản lý thông tin nhân viên và tổ chức"
    />
    
    <AppCard class="q-mt-md">
      <EmptyState
        icon="people"
        title="Chưa có dữ liệu"
        description="Chức năng quản lý nhân sự đang được phát triển"
      />
    </AppCard>
  </q-page>
</template>

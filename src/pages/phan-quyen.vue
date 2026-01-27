<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Phân Quyền"
      subtitle="Quản lý quyền truy cập và người dùng"
    />
    
    <AppCard class="q-mt-md">
      <EmptyState
        icon="admin_panel_settings"
        title="Chưa có dữ liệu"
        description="Chức năng phân quyền đang được phát triển"
      />
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Kỹ Thuật"
      subtitle="Quản lý thông số kỹ thuật và bảo trì"
    />
    
    <AppCard class="q-mt-md">
      <EmptyState
        icon="engineering"
        title="Chưa có dữ liệu"
        description="Chức năng quản lý kỹ thuật đang được phát triển"
      />
    </AppCard>
  </q-page>
</template>

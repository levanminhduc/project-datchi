<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'

const threadModules = [
  {
    title: 'Dashboard',
    description: 'Tổng quan tình trạng kho chỉ',
    icon: 'dashboard',
    to: '/thread/dashboard',
    color: 'primary'
  },
  {
    title: 'Loại Chỉ',
    description: 'Quản lý danh mục loại chỉ',
    icon: 'category',
    to: '/thread',
    color: 'secondary'
  },
  {
    title: 'Tồn Kho Chỉ',
    description: 'Theo dõi tồn kho theo cuộn',
    icon: 'inventory',
    to: '/thread/inventory',
    color: 'positive'
  },
  {
    title: 'Phân Bổ',
    description: 'Phân bổ chỉ cho đơn hàng',
    icon: 'assignment',
    to: '/thread/allocations',
    color: 'info'
  },
  {
    title: 'Thu Hồi',
    description: 'Thu hồi chỉ dư từ sản xuất',
    icon: 'assignment_return',
    to: '/thread/recovery',
    color: 'warning'
  }
]
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Kho"
      subtitle="Quản lý nhập xuất và tồn kho"
    />
    
    <div class="row q-col-gutter-md q-mt-md">
      <div
        v-for="module in threadModules"
        :key="module.to"
        class="col-12 col-sm-6 col-md-4"
      >
        <AppCard class="cursor-pointer module-card">
          <router-link
            :to="module.to"
            class="text-decoration-none"
          >
            <q-card-section class="row items-center q-gutter-md">
              <q-avatar
                :color="module.color"
                text-color="white"
                size="56px"
                :icon="module.icon"
              />
              <div>
                <div class="text-h6 text-grey-9">
                  {{ module.title }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ module.description }}
                </div>
              </div>
            </q-card-section>
          </router-link>
        </AppCard>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.module-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

.text-decoration-none {
  text-decoration: none;
  color: inherit;
}
</style>

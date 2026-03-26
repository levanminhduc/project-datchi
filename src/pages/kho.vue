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
    title: 'Lô Hàng',
    description: 'Quản lý lô nhập kho',
    icon: 'inventory_2',
    to: '/thread/lots',
    color: 'teal'
  },
  {
    title: 'Nhập Kho',
    description: 'Nhập kho hàng loạt',
    icon: 'move_to_inbox',
    to: '/thread/batch/receive',
    color: 'indigo'
  },
  {
    title: 'Chuyển Kho',
    description: 'Chuyển kho hàng loạt',
    icon: 'swap_horiz',
    to: '/thread/batch/transfer',
    color: 'purple'
  },
  {
    title: 'Xuất Kho',
    description: 'Xuất kho hàng loạt',
    icon: 'output',
    to: '/thread/batch/issue',
    color: 'orange'
  },
  {
    title: 'Lịch Sử Thao Tác',
    description: 'Xem lịch sử nhập xuất kho',
    icon: 'history',
    to: '/thread/batch/history',
    color: 'blue-grey'
  },
  {
    title: 'Phân Bổ',
    description: 'Phân bổ chỉ cho đơn hàng',
    icon: 'assignment',
    to: '/thread/allocations',
    color: 'info'
  },
  {
    title: 'Xuất Kho SX',
    description: 'Quản lý phiếu xuất kho sản xuất',
    icon: 'output',
    to: '/thread/issues',
    color: 'deep-orange'
  },
  {
    title: 'Đối Chiếu',
    description: 'Đối chiếu tiêu hao chỉ',
    icon: 'fact_check',
    to: '/thread/issues/reconciliation',
    color: 'cyan'
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
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <router-link
          :to="module.to"
          class="text-decoration-none"
        >
          <AppCard 
            class="module-card full-height"
            bordered
          >
            <q-card-section class="row items-center no-wrap q-pa-md">
              <q-avatar
                :color="module.color"
                text-color="white"
                size="52px"
                :icon="module.icon"
                class="module-avatar"
              />
              <div class="q-ml-md col">
                <div class="text-subtitle1 text-weight-medium module-title">
                  {{ module.title }}
                </div>
                <div class="text-caption module-description">
                  {{ module.description }}
                </div>
              </div>
              <q-icon 
                name="chevron_right" 
                size="20px" 
                class="module-arrow"
              />
            </q-card-section>
          </AppCard>
        </router-link>
      </div>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.module-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-3px);
    
    :deep(.module-avatar) {
      transform: scale(1.05);
    }
    
    .module-arrow {
      transform: translateX(3px);
      opacity: 1;
    }
  }
}

.module-avatar {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.module-title {
  line-height: 1.3;
}

.module-description {
  line-height: 1.4;
  opacity: 0.7;
}

.module-arrow {
  opacity: 0.4;
  transition: all 0.25s ease;
  flex-shrink: 0;
  color: var(--q-secondary);
}

.text-decoration-none {
  text-decoration: none;
  color: inherit;
  display: block;
}

.full-height {
  height: 100%;
}
</style>

<!-- Unscoped styles for body class selectors -->
<style lang="scss">
.body--light .module-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.body--dark .module-card:hover {
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.08);
}
</style>

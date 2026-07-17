<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import { ModuleLinkCard } from '@/components/ui/cards'
import { useSidebar } from '@/composables'

const { hubModuleLinks } = useSidebar()
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Quản lý Kho"
      subtitle="Quản lý nhập xuất và tồn kho"
    />

    <div class="row q-col-gutter-md q-mt-md items-stretch">
      <div
        v-for="module in hubModuleLinks"
        :key="module.to"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <ModuleLinkCard
          :title="module.title"
          :icon="module.icon"
          :to="module.to"
          :color="module.color"
        />
      </div>
    </div>
  </q-page>
</template>

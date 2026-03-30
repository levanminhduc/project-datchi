<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGuides } from '@/composables/useGuides'
import { useAuth } from '@/composables/useAuth'
import GuideCard from '@/components/guides/GuideCard.vue'

definePage({
  meta: { requiresAuth: true },
})

const router = useRouter()
const { hasPermission } = useAuth()
const { guides, loading, search, fetchGuides, removeGuide, togglePublish } = useGuides()

const isAdmin = hasPermission('guides.create')

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchGuides, 300)
})

onMounted(fetchGuides)

function goToGuide(slug: string) {
  router.push(`/guides/${slug}`)
}

function goToEditor(id?: string) {
  const query = id ? { id } : {}
  router.push({ path: '/guides/editor', query })
}

async function confirmDelete(id: string) {
  if (window.confirm('Bạn có chắc muốn xóa bài hướng dẫn này?')) {
    await removeGuide(id)
  }
}
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Hướng dẫn sử dụng</div>
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        label="Tạo mới"
        @click="goToEditor()"
      />
    </div>

    <q-input
      v-model="search"
      dense
      outlined
      placeholder="Tìm kiếm bài viết..."
      class="q-mb-md"
      clearable
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="guides.length === 0" class="text-center q-pa-xl text-grey">
      <q-icon name="menu_book" size="64px" class="q-mb-md" />
      <div class="text-h6">Chưa có bài hướng dẫn nào</div>
      <div v-if="isAdmin" class="text-body2 q-mt-sm">Bấm "Tạo mới" để viết bài hướng dẫn đầu tiên</div>
    </div>

    <div v-else class="q-gutter-md">
      <GuideCard
        v-for="guide in guides"
        :key="guide.id"
        :guide="guide"
        :is-admin="isAdmin"
        @click="goToGuide(guide.slug)"
        @edit="goToEditor(guide.id)"
        @delete="confirmDelete(guide.id)"
        @toggle-publish="togglePublish(guide.id)"
      />
    </div>
  </q-page>
</template>

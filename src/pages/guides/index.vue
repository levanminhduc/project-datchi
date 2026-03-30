<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
const showDeleteDialog = ref(false)
const deleteTargetId = ref<string | null>(null)

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

function confirmDelete(id: string) {
  deleteTargetId.value = id
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (deleteTargetId.value) {
    await removeGuide(deleteTargetId.value)
  }
  showDeleteDialog.value = false
  deleteTargetId.value = null
}
</script>

<template>
  <q-page padding>
    <PageHeader title="Hướng dẫn sử dụng">
      <template #actions>
        <AppButton
          v-if="isAdmin"
          color="primary"
          icon="add"
          label="Tạo mới"
          @click="goToEditor()"
        />
      </template>
    </PageHeader>

    <SearchInput
      v-model="search"
      placeholder="Tìm kiếm bài viết..."
      class="q-mb-md"
    />

    <div
      v-if="loading"
      class="text-center q-pa-xl"
    >
      <AppSpinner size="40px" />
    </div>

    <EmptyState
      v-else-if="guides.length === 0"
      icon="menu_book"
      title="Chưa có bài hướng dẫn nào"
      :description="isAdmin ? 'Bấm Tạo mới để viết bài hướng dẫn đầu tiên' : undefined"
    />

    <div
      v-else
      class="q-gutter-md"
    >
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

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Xóa bài hướng dẫn"
      message="Bạn có chắc muốn xóa bài hướng dẫn này?"
      confirm-text="Xóa"
      cancel-text="Hủy"
      @confirm="handleDelete"
    />
  </q-page>
</template>

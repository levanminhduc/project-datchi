<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guideService } from '@/services/guideService'
import { useAuth } from '@/composables/useAuth'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Guide } from '@/types/guides'
import '@/styles/guide-prose.scss'

definePage({
  meta: { requiresAuth: true },
})

const route = useRoute()
const router = useRouter()
const { hasPermission } = useAuth()
const snackbar = useSnackbar()

const guide = ref<Guide | null>(null)
const loading = ref(true)

const isAdmin = hasPermission('guides.edit')

onMounted(async () => {
  try {
    const slug = (route.params as { slug?: string }).slug || ''
    guide.value = await guideService.getBySlug(slug)
    if (!guide.value) {
      snackbar.error('Không tìm thấy bài hướng dẫn')
      router.push('/guides')
    }
  } catch {
    snackbar.error('Lỗi khi tải bài hướng dẫn')
    router.push('/guides')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <div
      v-if="loading"
      class="text-center q-pa-xl"
    >
      <AppSpinner size="40px" />
    </div>

    <template v-else-if="guide">
      <div class="row items-center q-mb-md q-gutter-x-sm">
        <IconButton
          icon="arrow_back"
          tooltip="Quay lại"
          @click="router.push('/guides')"
        />
        <div class="col text-h5 guide-title">
          {{ guide.title }}
        </div>
        <q-badge
          v-if="isAdmin && guide.status === 'DRAFT'"
          color="orange"
          label="Nháp"
          class="q-mr-xs"
        />
        <IconButton
          v-if="isAdmin"
          icon="edit"
          color="primary"
          tooltip="Sửa bài viết"
          @click="router.push({ path: '/guides/editor', query: { id: guide.id } })"
        />
      </div>

      <div class="text-caption text-grey q-mb-lg">
        {{ guide.published_at ? new Date(guide.published_at).toLocaleDateString('vi-VN') : '' }}
      </div>

      <div
        class="guide-prose"
        v-html="guide.content_html"
      />
    </template>
  </q-page>
</template>

<style scoped>
.guide-title {
  font-size: 1.5rem;
  line-height: 1.3;
  word-break: break-word;
}

@media (max-width: 599px) {
  .guide-title {
    font-size: 1.15rem;
  }
}
</style>

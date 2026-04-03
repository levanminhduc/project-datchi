<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guideService } from '@/services/guideService'
import { useAuth } from '@/composables/useAuth'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Guide } from '@/types/guides'
import '@/styles/guide-prose.scss'
import VueEasyLightbox from 'vue-easy-lightbox'
import { useGuideImageZoom } from '@/composables/use-guide-image-zoom'

definePage({
  meta: { requiresAuth: true },
})

const route = useRoute()
const router = useRouter()
const { hasPermission } = useAuth()
const snackbar = useSnackbar()

const guide = ref<Guide | null>(null)
const loading = ref(true)

const proseRef = ref<HTMLElement | null>(null)
const { visible, imgs, index, rescan, closeZoom } = useGuideImageZoom(proseRef)

watch(guide, async (val) => {
  if (val) {
    await nextTick()
    rescan()
  }
})

const isAdmin = hasPermission('guides.edit')

const copied = ref(false)

const publicUrl = computed(() => {
  if (!guide.value) return ''
  return `${window.location.origin}/g/${guide.value.slug}`
})

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

async function copyPublicLink() {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    snackbar.success('Đã sao chép link')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    snackbar.error('Không thể sao chép link')
  }
}
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
        ref="proseRef"
        class="guide-prose"
        v-html="guide.content_html"
      />

      <template v-if="guide.status === 'PUBLISHED'">
        <div class="guide-share-section q-pa-md q-mt-xl rounded-borders bg-grey-2">
          <div class="text-subtitle2 q-mb-sm">
            Chia Sẻ Bài Viết Này
          </div>
          <div class="row no-wrap items-center q-gutter-x-sm">
            <q-input
              :model-value="publicUrl"
              readonly
              dense
              outlined
              class="col"
              @focus="($event.target as HTMLInputElement)?.select()"
            />
            <q-btn
              flat
              round
              :icon="copied ? 'check' : 'content_copy'"
              :color="copied ? 'positive' : 'grey-7'"
              @click="copyPublicLink"
            >
              <q-tooltip>Sao chép link</q-tooltip>
            </q-btn>
          </div>
        </div>
      </template>
    </template>

    <VueEasyLightbox
      :visible="visible"
      :imgs="imgs"
      :index="index"
      @hide="closeZoom"
    />
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

.guide-share-section {
  max-width: 800px;
  margin: 0 auto;
}
</style>

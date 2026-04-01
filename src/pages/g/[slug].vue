<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import '@/styles/guide-prose.scss'

definePage({
  meta: { public: true },
})

interface PublicGuide {
  title: string
  slug: string
  content_html: string
  cover_image_url: string | null
  published_at: string | null
  author_name: string | null
}

const route = useRoute()
const snackbar = useSnackbar()

const guide = ref<PublicGuide | null>(null)
const loading = ref(true)
const error = ref(false)
const copied = ref(false)

const publicUrl = computed(() => {
  if (!guide.value) return ''
  return `${window.location.origin}/g/${guide.value.slug}`
})

onMounted(async () => {
  try {
    const slug = (route.params as { slug?: string }).slug || ''
    const response = await fetch(`/api/public/guides/${encodeURIComponent(slug)}`)
    const result = await response.json()

    if (!response.ok || result.error) {
      error.value = true
      return
    }

    guide.value = result.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

async function copyLink() {
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
      <q-spinner
        size="40px"
        color="primary"
      />
    </div>

    <div
      v-else-if="error"
      class="text-center q-pa-xl"
    >
      <q-icon
        name="article"
        size="64px"
        color="grey-5"
      />
      <div class="text-h6 text-grey-7 q-mt-md">
        Bài viết không tồn tại hoặc chưa được xuất bản
      </div>
      <q-btn
        flat
        color="primary"
        label="Về trang chủ"
        icon="home"
        to="/"
        class="q-mt-md"
      />
    </div>

    <template v-else-if="guide">
      <div class="guide-public-header q-mb-lg">
        <h1 class="text-h4 q-mb-xs guide-public-title">
          {{ guide.title }}
        </h1>
        <div class="text-caption text-grey">
          <span v-if="guide.author_name">{{ guide.author_name }}</span>
          <span v-if="guide.author_name && guide.published_at"> · </span>
          <span v-if="guide.published_at">{{ new Date(guide.published_at).toLocaleDateString('vi-VN') }}</span>
        </div>
      </div>

      <div
        class="guide-prose"
        v-html="guide.content_html"
      />

      <q-separator class="q-my-xl" />

      <div class="guide-share-section q-pa-md rounded-borders bg-grey-2">
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
            @click="copyLink"
          >
            <q-tooltip>Sao chép link</q-tooltip>
          </q-btn>
        </div>
      </div>
    </template>
  </q-page>
</template>

<style scoped>
.guide-public-title {
  font-size: 1.75rem;
  line-height: 1.3;
  word-break: break-word;
}

.guide-share-section {
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 599px) {
  .guide-public-title {
    font-size: 1.3rem;
  }
}
</style>

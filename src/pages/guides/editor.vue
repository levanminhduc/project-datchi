<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EditorContent } from '@tiptap/vue-3'
import { useGuideEditor } from '@/composables/useGuideEditor'
import { guideService } from '@/services/guideService'
import { useSnackbar } from '@/composables/useSnackbar'
import GuideToolbar from '@/components/guides/GuideToolbar.vue'
import GuidePreview from '@/components/guides/GuidePreview.vue'
import '@/styles/guide-prose.scss'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['guides.create'],
  },
})

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()

const title = ref('')
const guideId = ref<string | null>(null)
const loadingPage = ref(true)
const saving = ref(false)

const { editor, previewHtml, setContent, getContent, handleImageUpload } = useGuideEditor()

const isEdit = computed(() => !!guideId.value)

onMounted(async () => {
  const id = route.query.id as string | undefined
  if (id) {
    try {
      guideId.value = id
      const guide = await guideService.getById(id)
      if (guide) {
        title.value = guide.title
        setContent(guide.content || {})
      } else {
        snackbar.error('Không tìm thấy bài hướng dẫn')
        router.push('/guides')
      }
    } catch {
      snackbar.error('Lỗi khi tải bài hướng dẫn')
    }
  }
  loadingPage.value = false
})

async function saveGuide(status: 'DRAFT' | 'PUBLISHED') {
  if (!title.value.trim()) {
    snackbar.error('Vui lòng nhập tiêu đề')
    return
  }

  saving.value = true
  try {
    const { json, html } = getContent()
    const payload = {
      title: title.value.trim(),
      content: json,
      content_html: html,
      status,
    }

    if (isEdit.value) {
      const updated = await guideService.update(guideId.value!, payload)
      guideId.value = updated.id
      snackbar.success(status === 'PUBLISHED' ? 'Đã xuất bản' : 'Đã lưu nháp')
    } else {
      const created = await guideService.create(payload)
      guideId.value = created.id
      router.replace({ path: '/guides/editor', query: { id: created.id } })
      snackbar.success(status === 'PUBLISHED' ? 'Đã xuất bản' : 'Đã lưu nháp')
    }
  } catch {
    snackbar.error('Lỗi khi lưu bài hướng dẫn')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-page padding>
    <div
      v-if="loadingPage"
      class="text-center q-pa-xl"
    >
      <AppSpinner size="40px" />
    </div>

    <template v-else>
      <div class="row items-center q-mb-md q-gutter-x-sm">
        <IconButton
          icon="arrow_back"
          tooltip="Quay lại"
          @click="router.push('/guides')"
        />
        <div class="text-h6 col">
          {{ isEdit ? 'Chỉnh sửa hướng dẫn' : 'Tạo hướng dẫn mới' }}
        </div>
        <AppButton
          outline
          color="grey"
          icon="save"
          :label="$q.screen.gt.xs ? 'Lưu nháp' : undefined"
          :loading="saving"
          :dense="$q.screen.xs"
          @click="saveGuide('DRAFT')"
        />
        <AppButton
          color="primary"
          icon="publish"
          :label="$q.screen.gt.xs ? 'Xuất bản' : undefined"
          :loading="saving"
          :dense="$q.screen.xs"
          @click="saveGuide('PUBLISHED')"
        />
      </div>

      <AppInput
        v-model="title"
        placeholder="Tiêu đề bài hướng dẫn"
        class="q-mb-md text-h6"
      />

      <GuideToolbar
        :editor="editor"
        @upload-image="handleImageUpload"
      />

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <div class="editor-area">
            <EditorContent
              :editor="editor"
              class="guide-editor-content"
            />
          </div>
        </div>
        <div class="col-12 col-md-6">
          <GuidePreview :html="previewHtml" />
        </div>
      </div>
    </template>
  </q-page>
</template>

<style lang="scss">
.guide-editor-content {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-top: none;
  border-radius: 0 0 4px 4px;
  min-height: 300px;
  padding: 1rem;

  .ProseMirror {
    outline: none;
    min-height: 280px;

    table {
      border-collapse: collapse;
      width: 100%;
      th, td {
        border: 1px solid rgba(0, 0, 0, 0.12);
        padding: 0.5em 0.75em;
        min-width: 80px;
        position: relative;
      }
      th {
        background: rgba(0, 0, 0, 0.04);
        font-weight: 600;
      }
      .selectedCell {
        background: rgba(25, 118, 210, 0.1);
      }
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      &.ProseMirror-selectednode {
        outline: 2px solid var(--q-primary, #1976d2);
      }
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: rgba(0, 0, 0, 0.3);
      pointer-events: none;
      height: 0;
    }
  }
}

.body--dark .guide-editor-content {
  border-color: rgba(255, 255, 255, 0.12);
  .ProseMirror {
    table {
      th, td { border-color: rgba(255, 255, 255, 0.12); }
      th { background: rgba(255, 255, 255, 0.06); }
    }
    p.is-editor-empty:first-child::before {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}
</style>

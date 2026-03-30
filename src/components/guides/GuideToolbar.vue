<script setup lang="ts">
import { ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor | undefined
}

const props = defineProps<Props>()
defineEmits<{ uploadImage: [] }>()

const showLinkDialog = ref(false)
const linkUrl = ref('')

function setLink() {
  if (!props.editor) return
  if (props.editor.isActive('link')) {
    props.editor.chain().focus().unsetLink().run()
    return
  }
  linkUrl.value = ''
  showLinkDialog.value = true
}

function confirmLink() {
  if (props.editor && linkUrl.value) {
    props.editor.chain().focus().setLink({ href: linkUrl.value }).run()
  }
  showLinkDialog.value = false
}
</script>

<template>
  <div
    v-if="editor"
    class="guide-toolbar q-pa-xs q-gutter-xs row items-center flex-wrap"
  >
    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="format_bold"
        size="sm"
        :color="editor.isActive('bold') ? 'primary' : ''"
        @click="editor.chain().focus().toggleBold().run()"
      />
      <q-btn
        flat
        dense
        icon="format_italic"
        size="sm"
        :color="editor.isActive('italic') ? 'primary' : ''"
        @click="editor.chain().focus().toggleItalic().run()"
      />
      <q-btn
        flat
        dense
        icon="format_underlined"
        size="sm"
        :color="editor.isActive('underline') ? 'primary' : ''"
        @click="editor.chain().focus().toggleUnderline().run()"
      />
      <q-btn
        flat
        dense
        icon="strikethrough_s"
        size="sm"
        :color="editor.isActive('strike') ? 'primary' : ''"
        @click="editor.chain().focus().toggleStrike().run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        label="H1"
        size="sm"
        :color="editor.isActive('heading', { level: 1 }) ? 'primary' : ''"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      />
      <q-btn
        flat
        dense
        label="H2"
        size="sm"
        :color="editor.isActive('heading', { level: 2 }) ? 'primary' : ''"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <q-btn
        flat
        dense
        label="H3"
        size="sm"
        :color="editor.isActive('heading', { level: 3 }) ? 'primary' : ''"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="format_list_bulleted"
        size="sm"
        :color="editor.isActive('bulletList') ? 'primary' : ''"
        @click="editor.chain().focus().toggleBulletList().run()"
      />
      <q-btn
        flat
        dense
        icon="format_list_numbered"
        size="sm"
        :color="editor.isActive('orderedList') ? 'primary' : ''"
        @click="editor.chain().focus().toggleOrderedList().run()"
      />
      <q-btn
        flat
        dense
        icon="format_quote"
        size="sm"
        :color="editor.isActive('blockquote') ? 'primary' : ''"
        @click="editor.chain().focus().toggleBlockquote().run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="format_align_left"
        size="sm"
        :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : ''"
        @click="editor.chain().focus().setTextAlign('left').run()"
      />
      <q-btn
        flat
        dense
        icon="format_align_center"
        size="sm"
        :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : ''"
        @click="editor.chain().focus().setTextAlign('center').run()"
      />
      <q-btn
        flat
        dense
        icon="format_align_right"
        size="sm"
        :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : ''"
        @click="editor.chain().focus().setTextAlign('right').run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="link"
        size="sm"
        :color="editor.isActive('link') ? 'primary' : ''"
        @click="setLink"
      />
      <q-btn
        flat
        dense
        icon="image"
        size="sm"
        @click="$emit('uploadImage')"
      />
      <q-btn
        flat
        dense
        icon="table_chart"
        size="sm"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="horizontal_rule"
        size="sm"
        @click="editor.chain().focus().setHorizontalRule().run()"
      />
      <q-btn
        flat
        dense
        icon="code"
        size="sm"
        :color="editor.isActive('codeBlock') ? 'primary' : ''"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      />
    </q-btn-group>

    <q-separator vertical />

    <q-btn-group flat>
      <q-btn
        flat
        dense
        icon="undo"
        size="sm"
        :disable="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      />
      <q-btn
        flat
        dense
        icon="redo"
        size="sm"
        :disable="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      />
    </q-btn-group>

    <template v-if="editor.isActive('table')">
      <q-separator vertical />
      <q-btn-group flat>
        <q-btn
          flat
          dense
          icon="add"
          size="sm"
          @click="editor.chain().focus().addColumnAfter().run()"
        >
          <q-tooltip>Thêm cột</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          icon="table_rows"
          size="sm"
          @click="editor.chain().focus().addRowAfter().run()"
        >
          <q-tooltip>Thêm dòng</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          icon="remove"
          size="sm"
          color="negative"
          @click="editor.chain().focus().deleteColumn().run()"
        >
          <q-tooltip>Xóa cột</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          icon="delete_outline"
          size="sm"
          color="negative"
          @click="editor.chain().focus().deleteRow().run()"
        >
          <q-tooltip>Xóa dòng</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          icon="delete_forever"
          size="sm"
          color="negative"
          @click="editor.chain().focus().deleteTable().run()"
        >
          <q-tooltip>Xóa bảng</q-tooltip>
        </q-btn>
      </q-btn-group>
    </template>

    <AppDialog
      v-model="showLinkDialog"
      title="Chèn liên kết"
      max-width="400px"
    >
      <AppInput
        v-model="linkUrl"
        label="URL"
        placeholder="https://..."
        autofocus
        @keyup.enter="confirmLink"
      />
      <template #actions>
        <AppButton
          flat
          label="Hủy"
          @click="showLinkDialog = false"
        />
        <AppButton
          color="primary"
          label="Chèn"
          @click="confirmLink"
        />
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss">
.guide-toolbar {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: rgba(0, 0, 0, 0.02);
  gap: 2px;
}

.body--dark .guide-toolbar {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

@media (max-width: 599px) {
  .guide-toolbar {
    padding: 2px !important;

    :deep(.q-separator--vertical) {
      display: none;
    }

    :deep(.q-btn-group) {
      margin: 1px;
    }

    :deep(.q-btn) {
      min-width: 28px;
      min-height: 28px;
      padding: 2px;
    }
  }
}
</style>

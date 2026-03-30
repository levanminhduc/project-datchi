import { onBeforeUnmount, ref } from 'vue'
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { guideService } from '@/services/guideService'
import { useSnackbar } from '@/composables/useSnackbar'

export function useGuideEditor() {
  const previewHtml = ref('')
  const snackbar = useSnackbar()
  const isSaving = ref(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Bắt đầu viết hướng dẫn...' }),
    ],
    onUpdate({ editor: ed }) {
      previewHtml.value = ed.getHTML()
    },
  })

  function setContent(json: Record<string, unknown>) {
    if (editor.value && Object.keys(json).length > 0) {
      editor.value.commands.setContent(json)
      previewHtml.value = editor.value.getHTML()
    }
  }

  function getContent() {
    if (!editor.value) return { json: {}, html: '' }
    return {
      json: editor.value.getJSON(),
      html: editor.value.getHTML(),
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      return await guideService.uploadImage(file)
    } catch {
      snackbar.error('Lỗi khi tải ảnh lên')
      return null
    }
  }

  async function handleImageUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await uploadImage(file)
      if (url && editor.value) {
        editor.value.chain().focus().setImage({ src: url }).run()
      }
    }
    input.click()
  }

  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  return {
    editor,
    previewHtml,
    isSaving,
    setContent,
    getContent,
    handleImageUpload,
    uploadImage,
  }
}

import { computed, onBeforeUnmount, ref } from 'vue'
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { guideService } from '@/services/guideService'
import { useSnackbar } from '@/composables/useSnackbar'

export function useGuideEditor() {
  const previewHtml = ref('')
  const snackbar = useSnackbar()
  const isSaving = ref(false)
  const uploadingCount = ref(0)
  const isUploading = computed(() => uploadingCount.value > 0)
  const pendingUploads = ref(new Set<AbortController>())
  let editorDom: HTMLElement | null = null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
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
    onCreate({ editor: ed }) {
      editorDom = ed.view.dom as HTMLElement
      editorDom.addEventListener('paste', handlePaste)
      editorDom.addEventListener('drop', handleDrop)
    },
  })

  function handlePaste(event: Event) {
    const e = event as ClipboardEvent
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (file?.type.startsWith('image/')) {
          e.preventDefault()
          snackbar.error('Vui lòng dùng nút Thêm ảnh để tải lên')
          return
        }
      }
    }
  }

  function handleDrop(event: Event) {
    const e = event as DragEvent
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (file?.type.startsWith('image/')) {
          e.preventDefault()
          snackbar.error('Vui lòng dùng nút Thêm ảnh để tải lên')
          return
        }
      }
    }
  }

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
    const controller = new AbortController()
    pendingUploads.value.add(controller)
    uploadingCount.value++
    try {
      return await guideService.uploadImage(file, controller.signal)
    } catch {
      if (!controller.signal.aborted) {
        snackbar.error('Lỗi khi tải ảnh lên')
      }
      return null
    } finally {
      uploadingCount.value--
      pendingUploads.value.delete(controller)
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
    if (editorDom) {
      editorDom.removeEventListener('paste', handlePaste)
      editorDom.removeEventListener('drop', handleDrop)
      editorDom = null
    }
    editor.value?.destroy()
    for (const controller of pendingUploads.value) {
      controller.abort()
    }
    pendingUploads.value.clear()
  })

  return {
    editor,
    previewHtml,
    isSaving,
    isUploading,
    setContent,
    getContent,
    handleImageUpload,
    uploadImage,
  }
}

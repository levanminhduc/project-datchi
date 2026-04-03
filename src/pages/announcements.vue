<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PageHeader } from '@/components/ui/layout'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { announcementService } from '@/services/announcement-service'
import type {
  AnnouncementWithMeta,
  CreateAnnouncementData,
  AnnouncementPagination,
} from '@/types/announcement'

definePage({
  meta: {
    requiresRoot: true,
    title: 'Thông Báo Hệ Thống',
  },
})

const snackbar = useSnackbar()
const { confirm } = useConfirm()

const items = ref<AnnouncementWithMeta[]>([])
const pagination = ref<AnnouncementPagination>({ page: 1, pageSize: 25, total: 0 })
const loading = ref(false)
const formLoading = ref(false)

const showForm = ref(false)
const editingId = ref<number | null>(null)

const form = reactive<CreateAnnouncementData>({
  title: '',
  content: '',
  priority: 0,
})

const isEdit = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await announcementService.list(pagination.value.page, pagination.value.pageSize)
    items.value = res.data || []
    if (res.pagination) {
      pagination.value = res.pagination
    }
  } catch {
    snackbar.error('Lỗi tải danh sách thông báo')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.title = ''
  form.content = ''
  form.priority = 0
  showForm.value = true
}

function openEdit(item: AnnouncementWithMeta) {
  isEdit.value = true
  editingId.value = item.id
  form.title = item.title
  form.content = item.content
  form.priority = item.priority
  showForm.value = true
}

async function handleSubmit() {
  formLoading.value = true
  try {
    if (isEdit.value && editingId.value) {
      await announcementService.update(editingId.value, {
        title: form.title,
        content: form.content,
        priority: form.priority,
      })
      snackbar.success('Đã cập nhật thông báo')
    } else {
      await announcementService.create({
        title: form.title,
        content: form.content,
        priority: form.priority,
      })
      snackbar.success('Đã tạo thông báo')
    }
    showForm.value = false
    await loadData()
  } catch {
    snackbar.error('Lỗi khi lưu thông báo')
  } finally {
    formLoading.value = false
  }
}

async function handleToggle(item: AnnouncementWithMeta) {
  try {
    await announcementService.toggle(item.id)
    snackbar.success(item.is_active ? 'Đã tắt thông báo' : 'Đã bật thông báo')
    await loadData()
  } catch {
    snackbar.error('Lỗi khi thay đổi trạng thái')
  }
}

async function handleDelete(item: AnnouncementWithMeta) {
  const ok = await confirm({
    title: 'Xoá thông báo',
    message: `Bạn có chắc muốn xoá "${item.title}"?`,
    confirmText: 'Xoá',
    color: 'negative',
  })
  if (!ok) return

  try {
    await announcementService.remove(item.id)
    snackbar.success('Đã xoá thông báo')
    await loadData()
  } catch {
    snackbar.error('Lỗi khi xoá thông báo')
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function onPageChange(newPage: number) {
  pagination.value.page = newPage
  loadData()
}

onMounted(loadData)
</script>

<template>
  <q-page padding>
    <PageHeader title="Thông Báo Hệ Thống">
      <template #actions>
        <AppButton
          label="Tạo thông báo"
          icon="add"
          color="primary"
          @click="openCreate"
        />
      </template>
    </PageHeader>

    <q-card
      flat
      bordered
    >
      <q-markup-table
        flat
        bordered
        separator="horizontal"
        :loading="loading"
      >
        <thead>
          <tr>
            <th class="text-left">
              Tiêu đề
            </th>
            <th class="text-center">
              Trạng thái
            </th>
            <th class="text-center">
              Ưu tiên
            </th>
            <th class="text-center">
              Đã đọc
            </th>
            <th class="text-center">
              Ngày tạo
            </th>
            <th class="text-center">
              Người tạo
            </th>
            <th class="text-center">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td
              colspan="7"
              class="text-center q-pa-lg"
            >
              <q-spinner
                size="24px"
                class="q-mr-sm"
              />
              Đang tải...
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td
              colspan="7"
              class="text-center q-pa-lg text-grey"
            >
              Chưa có thông báo nào
            </td>
          </tr>
          <tr
            v-for="item in items"
            v-else
            :key="item.id"
          >
            <td
              class="text-left"
              style="max-width: 300px;"
            >
              <div class="ellipsis">
                {{ item.title }}
              </div>
            </td>
            <td class="text-center">
              <q-badge
                :color="item.is_active ? 'positive' : 'grey'"
                :label="item.is_active ? 'Đang hiển thị' : 'Đã tắt'"
              />
            </td>
            <td class="text-center">
              {{ item.priority }}
            </td>
            <td class="text-center">
              {{ item.dismissal_count }}/{{ item.total_employees }}
            </td>
            <td class="text-center">
              {{ formatDate(item.created_at) }}
            </td>
            <td class="text-center">
              {{ item.creator_name || '—' }}
            </td>
            <td class="text-center">
              <q-btn
                flat
                round
                dense
                :icon="item.is_active ? 'visibility_off' : 'visibility'"
                :color="item.is_active ? 'warning' : 'positive'"
                size="sm"
                @click="handleToggle(item)"
              >
                <q-tooltip>{{ item.is_active ? 'Tắt' : 'Bật' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                size="sm"
                @click="openEdit(item)"
              >
                <q-tooltip>Sửa</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click="handleDelete(item)"
              >
                <q-tooltip>Xoá</q-tooltip>
              </q-btn>
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <div
        v-if="pagination.total > pagination.pageSize"
        class="row justify-center q-pa-md"
      >
        <q-pagination
          :model-value="pagination.page"
          :max="Math.ceil(pagination.total / pagination.pageSize)"
          direction-links
          boundary-links
          @update:model-value="onPageChange"
        />
      </div>
    </q-card>

    <!-- Create/Edit Dialog -->
    <FormDialog
      v-model="showForm"
      :title="isEdit ? 'Sửa thông báo' : 'Tạo thông báo mới'"
      :loading="formLoading"
      max-width="600px"
      @submit="handleSubmit"
    >
      <div class="q-gutter-md">
        <AppInput
          v-model="form.title"
          label="Tiêu đề"
          required
          :rules="[(v: string) => !!v || 'Tiêu đề không được để trống']"
        />

        <div>
          <div class="text-body2 q-mb-xs">
            Nội dung
          </div>
          <q-editor
            v-model="form.content"
            :toolbar="[
              ['bold', 'italic', 'underline'],
              ['unordered', 'ordered'],
              ['undo', 'redo'],
            ]"
            min-height="150px"
            flat
            bordered
          />
        </div>

        <AppInput
          v-model.number="form.priority"
          label="Độ ưu tiên"
          type="number"
          hint="Số lớn hơn = hiển thị trước (mặc định: 0)"
        />
      </div>
    </FormDialog>
  </q-page>
</template>

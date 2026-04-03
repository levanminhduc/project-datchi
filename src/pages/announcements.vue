<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { PageHeader } from '@/components/ui/layout'
import DataTable from '@/components/ui/tables/DataTable.vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { announcementService } from '@/services/announcement-service'
import type {
  AnnouncementWithMeta,
  CreateAnnouncementData,
} from '@/types/announcement'

definePage({
  meta: {
    requiresRoot: true,
    title: 'Thong Bao He Thong',
  },
})

const snackbar = useSnackbar()
const { confirm } = useConfirm()

const items = ref<AnnouncementWithMeta[]>([])
const loading = ref(false)
const formLoading = ref(false)

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
  rowsNumber: 0,
})

const showForm = ref(false)
const editingId = ref<number | null>(null)

const form = reactive<CreateAnnouncementData>({
  title: '',
  content: '',
  priority: 0,
})

const isEdit = ref(false)

const columns: QTableColumn[] = [
  {
    name: 'title',
    label: 'Tiêu đề',
    field: 'title',
    align: 'left',
    style: 'max-width: 300px',
    classes: 'ellipsis',
  },
  {
    name: 'is_active',
    label: 'Trạng thái',
    field: 'is_active',
    align: 'center',
  },
  {
    name: 'priority',
    label: 'Ưu tiên',
    field: 'priority',
    align: 'center',
  },
  {
    name: 'read_count',
    label: 'Đã đọc',
    field: 'dismissal_count',
    align: 'center',
  },
  {
    name: 'created_at',
    label: 'Ngày tạo',
    field: 'created_at',
    align: 'center',
    format: (val: string) => {
      const d = new Date(val)
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    },
  },
  {
    name: 'creator_name',
    label: 'Người tạo',
    field: (row: AnnouncementWithMeta) => row.creator_name || '—',
    align: 'center',
  },
  {
    name: 'actions',
    label: 'Thao tác',
    field: 'actions',
    align: 'center',
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await announcementService.list(
      pagination.value.page,
      pagination.value.rowsPerPage,
    )
    items.value = res.data || []
    if (res.pagination) {
      pagination.value.rowsNumber = res.pagination.total
    }
  } catch {
    snackbar.error('Lỗi tải danh sách thông báo')
  } finally {
    loading.value = false
  }
}

function onTableRequest(props: {
  pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
}) {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  pagination.value.sortBy = props.pagination.sortBy
  pagination.value.descending = props.pagination.descending
  loadData()
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

    <DataTable
      v-model:pagination="pagination"
      :rows="items"
      :columns="columns"
      :loading="loading"
      row-key="id"
      empty-title="Chưa có thông báo nào"
      empty-subtitle="Tạo thông báo mới để hiển thị cho nhân viên"
      empty-icon="o_campaign"
      @request="onTableRequest"
    >
      <template #body-cell-is_active="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.is_active ? 'positive' : 'grey'"
            :label="props.row.is_active ? 'Đang hiển thị' : 'Đã tắt'"
          />
        </q-td>
      </template>

      <template #body-cell-read_count="props">
        <q-td :props="props">
          {{ props.row.dismissal_count }}/{{ props.row.total_employees }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            :icon="props.row.is_active ? 'visibility_off' : 'visibility'"
            :color="props.row.is_active ? 'warning' : 'positive'"
            size="sm"
            @click="handleToggle(props.row)"
          >
            <q-tooltip>{{ props.row.is_active ? 'Tắt' : 'Bật' }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="primary"
            size="sm"
            @click="openEdit(props.row)"
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
            @click="handleDelete(props.row)"
          >
            <q-tooltip>Xoá</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </DataTable>

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

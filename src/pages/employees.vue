<template>
  <q-page padding>
    <PageHeader title="Quản Lý Nhân Viên">
      <template #actions>
        <SearchInput
          v-model="searchQuery"
          placeholder="Tìm kiếm nhân viên..."
          hide-bottom-space
          class="search-input"
        />
        <q-btn
          color="primary"
          icon="add"
          label="Thêm Nhân Viên"
          unelevated
          class="full-width-xs"
          @click="openAddDialog"
        />
        <q-btn
          v-if="isRoot"
          color="grey-7"
          icon="settings"
          label="Cấu hình"
          outline
          @click="openConfigDialog"
        />
      </template>
    </PageHeader>

    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="filteredEmployees"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :rows-per-page-options="rowsPerPageOptions"
      class="employee-table"
    >
      <template #loading>
        <InnerLoading showing />
      </template>

      <template #no-data>
        <EmptyState
          icon="people"
          :title="searchQuery ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'"
          :subtitle="!searchQuery ? 'Nhấn &quot;Thêm Nhân Viên&quot; để bắt đầu' : undefined"
        />
      </template>

      <template #body-cell-full_name="props">
        <q-td
          :props="props"
          class="cursor-pointer editable-cell"
        >
          <AppSpinner
            v-if="inlineEditLoading[getCellKey(props.row.id, 'full_name')]"
            size="sm"
          />
          <template v-else>
            <span class="cell-value">{{ props.row.full_name }}</span>
            <q-icon
              name="edit"
              size="xs"
              class="edit-hint q-ml-xs text-grey-5"
            />
            <q-popup-edit
              v-slot="scope"
              v-model="props.row.full_name"
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val: string, initialVal: string) => handleInlineEdit(props.row.id, 'full_name', val, initialVal)"
            >
              <q-input
                v-model="scope.value"
                dense
                autofocus
                :rules="[(val: string) => !!val?.trim() || 'Không được để trống']"
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </template>
        </q-td>
      </template>

      <template #body-cell-department="props">
        <q-td
          :props="props"
          class="cursor-pointer editable-cell"
        >
          <AppSpinner
            v-if="inlineEditLoading[getCellKey(props.row.id, 'department')]"
            size="sm"
          />
          <template v-else>
            <span class="cell-value">{{ props.row.department }}</span>
            <q-icon
              name="edit"
              size="xs"
              class="edit-hint q-ml-xs text-grey-5"
            />
            <q-popup-edit
              v-slot="scope"
              v-model="props.row.department"
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val: string, initialVal: string) => handleInlineEdit(props.row.id, 'department', val, initialVal)"
            >
              <AppSelect
                v-model="scope.value"
                :options="departmentOptions"
                dense
                use-input
                fill-input
                hide-selected
                popup-content-class="z-max"
                class="inline-select"
              />
            </q-popup-edit>
          </template>
        </q-td>
      </template>

      <template #body-cell-chuc_vu="props">
        <q-td
          :props="props"
          class="cursor-pointer editable-cell"
        >
          <AppSpinner
            v-if="inlineEditLoading[getCellKey(props.row.id, 'chuc_vu')]"
            size="sm"
          />
          <template v-else>
            <span class="cell-value">{{ props.row.chuc_vu }}</span>
            <q-icon
              name="edit"
              size="xs"
              class="edit-hint q-ml-xs text-grey-5"
            />
            <q-popup-edit
              v-slot="scope"
              v-model="props.row.chuc_vu"
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val: string, initialVal: string) => handleInlineEdit(props.row.id, 'chuc_vu', val, initialVal)"
            >
              <AppSelect
                v-model="scope.value"
                :options="chucVuOptions"
                dense
                use-input
                fill-input
                hide-selected
                popup-content-class="z-max"
                class="inline-select"
              />
            </q-popup-edit>
          </template>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <IconButton
            icon="visibility"
            color="info"
            @click="openDetailDialog(props.row)"
          >
            <AppTooltip text="Xem chi tiết" />
          </IconButton>
          <IconButton
            icon="edit"
            color="primary"
            @click="openEditDialog(props.row)"
          >
            <AppTooltip text="Sửa (Modal)" />
          </IconButton>
          <IconButton
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          >
            <AppTooltip text="Xóa" />
          </IconButton>
        </q-td>
      </template>
    </q-table>

    <FormDialog
      v-model="formDialog.isOpen"
      :title="formDialog.mode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'"
      submit-text="Lưu"
      cancel-text="Hủy"
      :loading="loading"
      persistent
      max-width="500px"
      @submit="handleSubmit"
      @cancel="closeFormDialog"
    >
      <div class="q-gutter-md">
        <AppInput
          v-model="formData.employee_id"
          label="Mã Nhân Viên"
          prepend-icon="badge"
          required
          :disable="formDialog.mode === 'edit'"
        />

        <AppInput
          v-model="formData.full_name"
          label="Tên Nhân Viên"
          prepend-icon="person"
          required
        />

        <AppSelect
          v-model="formData.department"
          label="Phòng Ban"
          :options="departmentOptions"
          use-input
          new-value-mode="add-unique"
          behavior="menu"
          clearable
          popup-content-class="z-max"
        >
          <template #prepend>
            <q-icon name="business" />
          </template>
        </AppSelect>

        <AppSelect
          v-model="formData.chuc_vu"
          label="Chức Vụ"
          :options="chucVuOptions"
          use-input
          fill-input
          hide-selected
          clearable
          popup-content-class="z-max"
        >
          <template #prepend>
            <q-icon name="work" />
          </template>
        </AppSelect>

        <AppInput
          v-if="formDialog.mode === 'edit'"
          v-model="newPassword"
          label="Mật khẩu mới"
          type="password"
          prepend-icon="lock"
          autocomplete="new-password"
        />
      </div>
    </FormDialog>

    <DeleteDialog
      v-model="deleteDialog.isOpen"
      :item-name="deleteDialog.employee ? `${deleteDialog.employee.full_name} (${deleteDialog.employee.employee_id})` : ''"
      :loading="loading"
      @confirm="handleDelete"
    />

    <q-dialog v-model="detailDialog.isOpen">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Chi Tiết Nhân Viên
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-inner-loading :showing="detailLoading" />
          <div
            v-if="detailDialog.employee && !detailLoading"
            class="row q-col-gutter-sm"
          >
            <div class="col-12">
              <div class="row items-center q-mb-md">
                <q-avatar
                  size="48px"
                  color="primary"
                  text-color="white"
                  class="q-mr-md text-h6 text-weight-bold"
                >
                  {{ getInitials(detailDialog.employee.full_name) }}
                </q-avatar>
                <div>
                  <div class="text-h6">
                    {{ detailDialog.employee.full_name }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ detailDialog.employee.employee_id }}
                  </div>
                </div>
              </div>
            </div>

            <template
              v-for="field in visibleDetailFields"
              :key="field.key"
            >
              <div
                v-if="field.key !== 'employee_id' && field.key !== 'full_name'"
                class="col-12 col-sm-6"
              >
                <div class="text-caption text-grey-7">
                  {{ field.label }}
                </div>
                <div class="text-subtitle1">
                  <q-badge
                    v-if="field.key === 'is_active' || field.key === 'must_change_password'"
                    :color="getBooleanValue(detailDialog.employee, field.key) ? 'positive' : 'negative'"
                  >
                    {{ getBooleanLabel(detailDialog.employee, field.key) }}
                  </q-badge>
                  <template v-else-if="isDatetimeField(field.key)">
                    {{ formatDateTime(getFieldValue(detailDialog.employee, field.key) as string) }}
                  </template>
                  <template v-else>
                    {{ getFieldValue(detailDialog.employee, field.key) ?? '-' }}
                  </template>
                </div>
              </div>
            </template>
          </div>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-px-md q-pb-md"
        >
          <q-btn
            flat
            label="Chỉnh sửa"
            color="primary"
            icon="edit"
            @click="editFromDetail"
          />
          <q-btn
            v-close-popup
            unelevated
            label="Đóng"
            color="grey"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="configDialog.isOpen">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Cấu hình hiển thị chi tiết
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-card-section>
          <draggable
            v-model="configDialog.fields"
            item-key="key"
            handle=".drag-handle"
          >
            <template #item="{ element }">
              <div class="config-field-row q-py-xs">
                <q-icon
                  name="drag_indicator"
                  class="drag-handle cursor-grab q-mr-sm text-grey-6"
                  size="sm"
                />
                <q-checkbox
                  v-model="element.visible"
                  :disable="element.required"
                  dense
                  class="q-mr-sm"
                />
                <span class="config-field-label">{{ element.label }}</span>
                <q-icon
                  v-if="element.required"
                  name="lock"
                  size="xs"
                  class="q-ml-xs text-grey-5"
                />
              </div>
            </template>
          </draggable>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-px-md q-pb-md"
        >
          <q-btn
            flat
            label="Khôi phục mặc định"
            color="orange"
            icon="restore"
            @click="restoreDefaultConfig"
          />
          <q-space />
          <q-btn
            flat
            label="Hủy"
            color="grey"
            @click="configDialog.isOpen = false"
          />
          <q-btn
            unelevated
            label="Lưu"
            color="primary"
            icon="save"
            :loading="configSaving"
            @click="saveConfig"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { type QTableColumn } from 'quasar'
import draggable from 'vuedraggable'
import { useEmployees, useSnackbar } from '@/composables'
import { useAuth } from '@/composables/useAuth'
import { employeeService } from '@/services/employeeService'
import type { Employee, EmployeeFormData } from '@/types'

interface FormDialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  employeeId: number | null
}

interface DeleteDialogState {
  isOpen: boolean
  employee: Employee | null
}

interface DetailDialogState {
  isOpen: boolean
  employee: Employee | null
}

interface DetailFieldConfig {
  key: string
  label: string
  visible: boolean
  required?: boolean
}

const snackbar = useSnackbar()
const { isRoot } = useAuth()

const {
  employees,
  loading,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = useEmployees()

const searchQuery = ref('')
const newPassword = ref('')
const inlineEditLoading = ref<Record<string, boolean>>({})
const detailLoading = ref(false)
const configSaving = ref(false)
const rowsPerPageOptions = [10, 25, 50, 100]

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
})

const formDialog = reactive<FormDialogState>({
  isOpen: false,
  mode: 'create',
  employeeId: null,
})

const formData = reactive<EmployeeFormData>({
  employee_id: '',
  full_name: '',
  department: '',
  chuc_vu: '',
})

const deleteDialog = reactive<DeleteDialogState>({
  isOpen: false,
  employee: null,
})

const detailDialog = reactive<DetailDialogState>({
  isOpen: false,
  employee: null,
})

const defaultDetailFields: DetailFieldConfig[] = [
  { key: 'employee_id', label: 'Mã Nhân Viên', visible: true, required: true },
  { key: 'full_name', label: 'Tên Nhân Viên', visible: true, required: true },
  { key: 'department', label: 'Phòng Ban', visible: true },
  { key: 'chuc_vu', label: 'Chức Vụ', visible: true },
  { key: 'is_active', label: 'Trạng thái', visible: true },
  { key: 'created_at', label: 'Ngày tạo', visible: true },
  { key: 'updated_at', label: 'Ngày cập nhật', visible: true },
  { key: 'last_login_at', label: 'Lần đăng nhập cuối', visible: false },
  { key: 'must_change_password', label: 'Bắt buộc đổi mật khẩu', visible: false },
  { key: 'password_changed_at', label: 'Ngày đổi mật khẩu', visible: false },
  { key: 'failed_login_attempts', label: 'Số lần đăng nhập thất bại', visible: false },
  { key: 'locked_until', label: 'Khóa đến', visible: false },
]

const configDialog = reactive<{ isOpen: boolean; fields: DetailFieldConfig[] }>({
  isOpen: false,
  fields: JSON.parse(JSON.stringify(defaultDetailFields)),
})

const columns: QTableColumn[] = [
  {
    name: 'employee_id',
    label: 'Mã NV',
    field: 'employee_id',
    align: 'left',
    sortable: true,
    required: true,
    style: 'min-width: 100px; width: 100px',
    headerStyle: 'min-width: 100px; width: 100px',
  },
  {
    name: 'full_name',
    label: 'Tên Nhân Viên',
    field: 'full_name',
    align: 'left',
    sortable: true,
    required: true,
    style: 'min-width: 180px; width: 200px',
    headerStyle: 'min-width: 180px; width: 200px',
  },
  {
    name: 'department',
    label: 'Phòng Ban',
    field: 'department',
    align: 'left',
    sortable: true,
    required: true,
    style: 'min-width: 150px; width: 150px',
    headerStyle: 'min-width: 150px; width: 150px',
  },
  {
    name: 'chuc_vu',
    label: 'Chức Vụ',
    field: 'chuc_vu',
    align: 'left',
    sortable: true,
    required: true,
    style: 'min-width: 130px; width: 130px',
    headerStyle: 'min-width: 130px; width: 130px',
  },
  {
    name: 'actions',
    label: 'Thao Tác',
    field: 'actions',
    align: 'center',
    required: true,
    style: 'min-width: 100px; width: 100px',
    headerStyle: 'min-width: 100px; width: 100px',
  },
]

const departmentOptions = computed(() => {
  const departments = [...new Set(employees.value.map(e => e.department).filter(Boolean))]
  return departments.sort((a, b) => a.localeCompare(b, 'vi')).map(dept => ({ label: dept, value: dept }))
})

const chucVuOptions = computed(() => {
  const positions = [...new Set(employees.value.map(e => e.chuc_vu).filter(Boolean))]
  return positions.sort((a, b) => a.localeCompare(b, 'vi')).map(pos => ({ label: pos, value: pos }))
})

const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) {
    return employees.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return employees.value.filter((emp) =>
    emp.full_name?.toLowerCase().includes(query) ||
    emp.employee_id?.toLowerCase().includes(query) ||
    emp.department?.toLowerCase().includes(query) ||
    emp.chuc_vu?.toLowerCase().includes(query)
  )
})

const visibleDetailFields = computed(() =>
  configDialog.fields.filter(f => f.visible)
)

watch(searchQuery, () => {
  pagination.value.page = 1
})

const getCellKey = (id: number, field: string): string => `${id}-${field}`

const getFieldValue = (employee: Record<string, unknown>, key: string): unknown => {
  return employee[key]
}

const getBooleanValue = (employee: Record<string, unknown>, key: string): boolean => {
  return !!employee[key]
}

const getBooleanLabel = (employee: Record<string, unknown>, key: string): string => {
  return employee[key] ? 'Có' : 'Không'
}

const isDatetimeField = (key: string): boolean => {
  return ['created_at', 'updated_at', 'last_login_at', 'password_changed_at', 'locked_until'].includes(key)
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'Chưa xác định'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const handleInlineEdit = async (
  id: number,
  field: 'full_name' | 'department' | 'chuc_vu',
  newValue: string,
  originalValue: string
): Promise<void> => {
  if (newValue === originalValue) return

  if (field === 'full_name' && !newValue?.trim()) {
    snackbar.error('Tên nhân viên không được để trống')
    const emp = employees.value.find(e => e.id === id)
    if (emp) {
      emp[field] = originalValue
    }
    return
  }

  const cellKey = getCellKey(id, field)
  inlineEditLoading.value[cellKey] = true

  try {
    const result = await updateEmployee(id, { [field]: newValue })
    if (!result) {
      const emp = employees.value.find(e => e.id === id)
      if (emp) {
        emp[field] = originalValue
      }
    }
  } catch {
    const emp = employees.value.find(e => e.id === id)
    if (emp) {
      emp[field] = originalValue
    }
  } finally {
    inlineEditLoading.value[cellKey] = false
  }
}

const openAddDialog = () => {
  formDialog.mode = 'create'
  formDialog.employeeId = null
  resetFormData()
  newPassword.value = ''
  formDialog.isOpen = true
}

const openEditDialog = (employee: Employee) => {
  formDialog.mode = 'edit'
  formDialog.employeeId = employee.id
  formData.employee_id = employee.employee_id
  formData.full_name = employee.full_name
  formData.department = employee.department || ''
  formData.chuc_vu = employee.chuc_vu || ''
  newPassword.value = ''
  formDialog.isOpen = true
}

const closeFormDialog = () => {
  formDialog.isOpen = false
  resetFormData()
}

const resetFormData = () => {
  formData.employee_id = ''
  formData.full_name = ''
  formData.department = ''
  formData.chuc_vu = ''
}

const handleSubmit = async () => {
  if (!formData.employee_id.trim() || !formData.full_name.trim()) {
    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
    return
  }

  let result: Employee | null = null

  if (formDialog.mode === 'create') {
    result = await createEmployee({ ...formData })
  } else if (formDialog.employeeId) {
    result = await updateEmployee(formDialog.employeeId, { ...formData })

    if (result && newPassword.value.trim()) {
      try {
        await employeeService.resetPassword(formDialog.employeeId, newPassword.value.trim())
      } catch {
        snackbar.error('Cập nhật thông tin thành công nhưng đổi mật khẩu thất bại')
      }
    }
  }

  if (result) {
    closeFormDialog()
  }
}

const confirmDelete = (employee: Employee) => {
  deleteDialog.employee = employee
  deleteDialog.isOpen = true
}

const handleDelete = async () => {
  if (!deleteDialog.employee) return

  const success = await deleteEmployee(deleteDialog.employee.id)

  if (success) {
    deleteDialog.isOpen = false
    deleteDialog.employee = null
  }
}

const openDetailDialog = (employee: Employee) => {
  detailDialog.employee = employee
  detailDialog.isOpen = true
}

const editFromDetail = () => {
  if (detailDialog.employee) {
    detailDialog.isOpen = false
    openEditDialog(detailDialog.employee)
  }
}

const openConfigDialog = () => {
  configDialog.isOpen = true
}

const saveConfig = async () => {
  configSaving.value = true
  try {
    configSaving.value = false
    configDialog.isOpen = false
    snackbar.success('Đã lưu cấu hình')
  } catch {
    configSaving.value = false
    snackbar.error('Lỗi khi lưu cấu hình')
  }
}

const restoreDefaultConfig = () => {
  configDialog.fields = JSON.parse(JSON.stringify(defaultDetailFields))
}

onMounted(() => {
  fetchEmployees()
})
</script>

<style scoped>
.search-input {
  min-width: 250px;
}

.inline-select {
  min-width: 200px;
}

.dialog-card {
  width: 500px;
  max-width: 90vw;
}

.employee-table {
  max-width: 100%;
}

.employee-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.employee-table :deep(.q-table) {
  table-layout: auto;
  min-width: 800px;
}

.employee-table :deep(th),
.employee-table :deep(td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.q-dialog__inner--minimized > div {
  max-width: 95vw;
}

.editable-cell {
  transition: background-color 0.2s ease;
}

.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.editable-cell .edit-hint {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.editable-cell:hover .edit-hint {
  opacity: 1;
}

.editable-cell .cell-value {
  display: inline-block;
}

@media (max-width: 599px) {
  .search-input {
    min-width: 100%;
  }

  .full-width-xs {
    width: 100%;
  }
}
</style>

<style>
.z-max {
  z-index: 9999 !important;
}
</style>

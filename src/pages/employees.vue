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
      </template>
    </PageHeader>

    <!-- Employee Table with Pagination -->
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

      <!-- Inline Edit: Full Name Column -->
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

      <!-- Inline Edit: Department Column -->
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
              <q-input
                v-model="scope.value"
                dense
                autofocus
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </template>
        </q-td>
      </template>

      <!-- Inline Edit: Chức Vụ Column with Dropdown -->
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
              <q-select
                v-model="scope.value"
                :options="chucVuOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                autofocus
                options-dense
                popup-content-class="z-max"
                style="min-width: 150px"
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
          :options="filteredDepartmentOptions"
          use-input
          new-value-mode="add-unique"
          behavior="menu"
          clearable
          popup-content-class="z-max"
          @filter="filterDepartments"
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
      </div>
    </FormDialog>

    <DeleteDialog
      v-model="deleteDialog.isOpen"
      :item-name="deleteDialog.employee ? `${deleteDialog.employee.full_name} (${deleteDialog.employee.employee_id})` : ''"
      :loading="loading"
      @confirm="handleDelete"
    />

    <q-dialog v-model="detailDialog.isOpen">
      <q-card
        v-if="detailDialog.employee"
        style="width: 500px; max-width: 90vw"
      >
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
          <div class="row q-col-gutter-sm">
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
                <q-space />
                <q-badge
                  :color="detailDialog.employee.is_active ? 'positive' : 'negative'"
                  class="q-ml-sm"
                >
                  {{ detailDialog.employee.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                </q-badge>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Phòng Ban
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.employee.department || '-' }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Chức Vụ
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.employee.chuc_vu || '-' }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Ngày Tạo
              </div>
              <div class="text-subtitle1">
                {{ formatDateTime(detailDialog.employee.created_at) }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Cập Nhật Lần Cuối
              </div>
              <div class="text-subtitle1">
                {{ formatDateTime(detailDialog.employee.updated_at) }}
              </div>
            </div>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { type QTableColumn } from 'quasar'
import { useEmployees, useSnackbar } from '@/composables'
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

const snackbar = useSnackbar()

// Composables
const {
  employees,
  loading,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = useEmployees()

// Local state
const searchQuery = ref('')

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
})

// Page size options for dropdown (AC8)
const rowsPerPageOptions = [10, 25, 50, 100]

// Reset pagination to page 1 when search/filter changes (AC9)
watch(searchQuery, () => {
  pagination.value.page = 1
})

// Inline edit loading state - tracks which cells are being saved
const inlineEditLoading = ref<Record<string, boolean>>({})

const departmentOptions = computed(() => {
  const departments = [...new Set(employees.value.map(e => e.department).filter(Boolean))]
  return departments.sort().map(dept => ({ label: dept, value: dept }))
})

// Chức vụ options - computed from unique values in employees (same pattern as departmentOptions)
const chucVuOptions = computed(() => {
  const positions = [...new Set(employees.value.map(e => e.chuc_vu).filter(Boolean))]
  return positions.sort().map(pos => ({ label: pos, value: pos }))
})

// Filtered options for department dropdown with use-input
const filteredDepartmentOptions = ref<{ label: string; value: string }[]>([])

// Filter handler for department dropdown
const filterDepartments = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (!val) {
      filteredDepartmentOptions.value = departmentOptions.value
    } else {
      const needle = val.toLowerCase()
      filteredDepartmentOptions.value = departmentOptions.value.filter(
        opt => opt.label.toLowerCase().includes(needle)
      )
    }
  })
}

// Initialize filteredDepartmentOptions when departmentOptions changes
watch(departmentOptions, (newOpts) => {
  filteredDepartmentOptions.value = newOpts
}, { immediate: true })

/**
 * Generate unique key for tracking cell loading state
 */
const getCellKey = (id: number, field: string): string => `${id}-${field}`

/**
 * Handle inline field edits via q-popup-edit
 * @param id - Employee ID
 * @param field - Field name being edited (full_name, department, chuc_vu)
 * @param newValue - New value from popup edit
 * @param originalValue - Original value for rollback on error
 */
const handleInlineEdit = async (
  id: number,
  field: 'full_name' | 'department' | 'chuc_vu',
  newValue: string,
  originalValue: string
): Promise<void> => {
  // Skip if no change
  if (newValue === originalValue) return

  // Validate non-empty for full_name (required field)
  if (field === 'full_name' && !newValue?.trim()) {
    snackbar.error('Tên nhân viên không được để trống')
    // Revert the value
    const emp = employees.value.find(e => e.id === id)
    if (emp) {
      emp[field] = originalValue
    }
    return
  }

  const cellKey = getCellKey(id, field)
  inlineEditLoading.value[cellKey] = true

  try {
    // Optimistic update already applied by v-model
    const result = await updateEmployee(id, { [field]: newValue })

    if (!result) {
      // Revert on error - find employee and restore original value
      const emp = employees.value.find(e => e.id === id)
      if (emp) {
        emp[field] = originalValue
      }
    }
    // Success notification is handled by useEmployees composable
  } catch {
    // Revert on error - composable already handles error notification
    const emp = employees.value.find(e => e.id === id)
    if (emp) {
      emp[field] = originalValue
    }
  } finally {
    inlineEditLoading.value[cellKey] = false
  }
}

// Form dialog state
const formDialog = reactive<FormDialogState>({
  isOpen: false,
  mode: 'create',
  employeeId: null,
})

// Form data
const formData = reactive<EmployeeFormData>({
  employee_id: '',
  full_name: '',
  department: '',
  chuc_vu: '',
})



// Delete dialog state
const deleteDialog = reactive<DeleteDialogState>({
  isOpen: false,
  employee: null,
})

const detailDialog = reactive<DetailDialogState>({
  isOpen: false,
  employee: null,
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

// Form dialog methods
const openAddDialog = () => {
  formDialog.mode = 'create'
  formDialog.employeeId = null
  resetFormData()
  formDialog.isOpen = true
}

const openEditDialog = (employee: Employee) => {
  formDialog.mode = 'edit'
  formDialog.employeeId = employee.id
  formData.employee_id = employee.employee_id
  formData.full_name = employee.full_name
  formData.department = employee.department || ''
  formData.chuc_vu = employee.chuc_vu || ''
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

// Submit handler for create/update
const handleSubmit = async () => {
  // Validate required fields
  if (!formData.employee_id.trim() || !formData.full_name.trim()) {
    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
    return
  }

  let result: Employee | null = null

  if (formDialog.mode === 'create') {
    result = await createEmployee({ ...formData })
  } else if (formDialog.employeeId) {
    result = await updateEmployee(formDialog.employeeId, { ...formData })
  }

  // Success notification is handled by useEmployees composable
  if (result) {
    closeFormDialog()
  }
}

// Delete confirmation
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

onMounted(() => {
  // Fetch employees - chucVuOptions computed from loaded employees
  fetchEmployees()
})
</script>

<style scoped>
.search-input {
  min-width: 250px;
}

@media (max-width: 599px) {
  .search-input {
    min-width: 100%;
  }

  .full-width-xs {
    width: 100%;
  }
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

/* Smooth transitions for dialogs */
.q-dialog__inner--minimized > div {
  max-width: 95vw;
}

/* Editable cell styles */
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
</style>

<style>
/* Global style for z-index fix in popup-edit dropdowns */
.z-max {
  z-index: 9999 !important;
}
</style>

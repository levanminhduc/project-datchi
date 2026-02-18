<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PageHeader } from '@/components/ui/layout'
import { AppCard } from '@/components/ui/cards'
import { EmptyState } from '@/components/ui/feedback'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import {
  usePermissionManagement,
  type EmployeeSearchResult,
  type EmployeeRolesPermissions,
} from '@/composables/usePermissionManagement'
import type { Role, Permission, CreateRoleData, UpdateRoleData, CreatePermissionData, UpdatePermissionData } from '@/types/auth'

// Route protection - ROOT only
definePage({
  meta: {
    requiresRoot: true, // Only ROOT can access (auth required by default)
    title: 'Phân Quyền',
  },
})

const snackbar = useSnackbar()
const { confirm } = useConfirm()
const permMgmt = usePermissionManagement()

// ============================================
// Tab State
// ============================================
const activeTab = ref('roles')

// ============================================
// Tab 1: Roles Management
// ============================================
const roleDialogOpen = ref(false)
const roleDialogMode = ref<'create' | 'edit'>('create')
const selectedRole = ref<Role | null>(null)
const roleForm = ref<CreateRoleData>({
  code: '',
  name: '',
  description: '',
  level: 10,
  permissionIds: [],
})
const rolePermissionIds = ref<number[]>([])

const roleColumns = [
  { name: 'code', label: 'Mã', field: 'code', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Tên vai trò', field: 'name', align: 'left' as const, sortable: true },
  { name: 'description', label: 'Mô tả', field: 'description', align: 'left' as const },
  { name: 'level', label: 'Cấp độ', field: 'level', align: 'center' as const, sortable: true },
  {
    name: 'isSystem',
    label: 'Hệ thống',
    field: 'isSystem',
    align: 'center' as const,
    format: (val: boolean) => (val ? 'Có' : 'Không'),
  },
  {
    name: 'isActive',
    label: 'Trạng thái',
    field: 'isActive',
    align: 'center' as const,
  },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

function openCreateRoleDialog() {
  roleDialogMode.value = 'create'
  selectedRole.value = null
  roleForm.value = {
    code: '',
    name: '',
    description: '',
    level: 10,
    permissionIds: [],
  }
  rolePermissionIds.value = []
  roleDialogOpen.value = true
}

async function openEditRoleDialog(role: Role) {
  roleDialogMode.value = 'edit'
  selectedRole.value = role
  roleForm.value = {
    code: role.code,
    name: role.name,
    description: role.description || '',
    level: role.level,
    permissionIds: [],
  }

  // Load role's current permissions
  try {
    const perms = await permMgmt.getRolePermissions(role.id)
    rolePermissionIds.value = perms.map((p) => p.id)
  } catch {
    rolePermissionIds.value = []
  }

  roleDialogOpen.value = true
}

async function saveRole() {
  try {
    if (roleDialogMode.value === 'create') {
      await permMgmt.createRole({
        ...roleForm.value,
        permissionIds: rolePermissionIds.value,
      })
      snackbar.success('Tạo vai trò thành công')
    } else if (selectedRole.value) {
      await permMgmt.updateRole(selectedRole.value.id, {
        name: roleForm.value.name,
        description: roleForm.value.description,
        level: roleForm.value.level,
        permissionIds: rolePermissionIds.value,
      })
      snackbar.success('Cập nhật vai trò thành công')
    }
    roleDialogOpen.value = false
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

async function confirmDeleteRole(role: Role) {
  if (role.isSystem) {
    snackbar.warning('Không thể xóa vai trò hệ thống')
    return
  }

  const confirmed = await confirm(`Bạn có chắc muốn xóa vai trò "${role.name}"?`)
  if (!confirmed) return

  try {
    await permMgmt.deleteRole(role.id)
    snackbar.success('Xóa vai trò thành công')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

function toggleRolePermission(permId: number) {
  const idx = rolePermissionIds.value.indexOf(permId)
  if (idx >= 0) {
    rolePermissionIds.value.splice(idx, 1)
  } else {
    rolePermissionIds.value.push(permId)
  }
}

function isPermissionSelected(permId: number) {
  return rolePermissionIds.value.includes(permId)
}

function selectAllModulePermissions(module: string) {
  const modulePerms = permMgmt.permissionsByModule.value[module] || []
  const allSelected = modulePerms.every((p) => rolePermissionIds.value.includes(p.id))

  if (allSelected) {
    // Deselect all in module
    for (const p of modulePerms) {
      const idx = rolePermissionIds.value.indexOf(p.id)
      if (idx >= 0) rolePermissionIds.value.splice(idx, 1)
    }
  } else {
    // Select all in module
    for (const p of modulePerms) {
      if (!rolePermissionIds.value.includes(p.id)) {
        rolePermissionIds.value.push(p.id)
      }
    }
  }
}

function isModuleAllSelected(module: string) {
  const modulePerms = permMgmt.permissionsByModule.value[module] || []
  return modulePerms.length > 0 && modulePerms.every((p) => rolePermissionIds.value.includes(p.id))
}

function isModuleSomeSelected(module: string) {
  const modulePerms = permMgmt.permissionsByModule.value[module] || []
  const selected = modulePerms.filter((p) => rolePermissionIds.value.includes(p.id))
  return selected.length > 0 && selected.length < modulePerms.length
}

// ============================================
// Tab 2: Permissions List
// ============================================
const permissionFilter = ref('')

const filteredPermissionsByModule = computed(() => {
  const filter = permissionFilter.value.toLowerCase()
  if (!filter) return permMgmt.permissionsByModule.value

  const result: Record<string, Permission[]> = {}
  for (const [module, perms] of Object.entries(permMgmt.permissionsByModule.value)) {
    const filtered = perms.filter(
      (p) =>
        p.code.toLowerCase().includes(filter) ||
        p.name.toLowerCase().includes(filter) ||
        p.description?.toLowerCase().includes(filter)
    )
    if (filtered.length > 0) {
      result[module] = filtered
    }
  }
  return result
})

const filteredModuleList = computed(() => Object.keys(filteredPermissionsByModule.value).sort())

// Permission CRUD
const permDialogOpen = ref(false)
const permDialogMode = ref<'create' | 'edit'>('create')
const selectedPermission = ref<Permission | null>(null)
const permForm = ref<CreatePermissionData>({
  code: '',
  name: '',
  description: '',
  module: '',
  resource: '',
  action: 'VIEW',
  routePath: '',
  isPageAccess: false,
  sortOrder: 0,
})

const actionOptions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE']

const existingModules = computed(() => {
  const modules = new Set<string>()
  for (const perm of permMgmt.permissions.value) {
    modules.add(perm.module)
  }
  return Array.from(modules).sort()
})

const moduleFilterOptions = ref<string[]>([])

function filterModuleOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (!val) {
      moduleFilterOptions.value = existingModules.value
    } else {
      const needle = val.toLowerCase()
      moduleFilterOptions.value = existingModules.value.filter((m) =>
        m.toLowerCase().includes(needle)
      )
    }
  })
}

function openCreatePermissionDialog() {
  permDialogMode.value = 'create'
  selectedPermission.value = null
  permForm.value = {
    code: '',
    name: '',
    description: '',
    module: '',
    resource: '',
    action: 'VIEW',
    routePath: '',
    isPageAccess: false,
    sortOrder: 0,
  }
  permDialogOpen.value = true
}

function openEditPermissionDialog(perm: Permission) {
  permDialogMode.value = 'edit'
  selectedPermission.value = perm
  permForm.value = {
    code: perm.code,
    name: perm.name,
    description: perm.description || '',
    module: perm.module,
    resource: perm.resource,
    action: perm.action,
    routePath: perm.routePath || '',
    isPageAccess: perm.isPageAccess,
    sortOrder: perm.sortOrder,
  }
  permDialogOpen.value = true
}

async function savePermission() {
  try {
    if (permDialogMode.value === 'create') {
      await permMgmt.createPermission(permForm.value)
      snackbar.success('Tạo quyền thành công')
    } else if (selectedPermission.value) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { code: _code, ...updateData } = permForm.value
      await permMgmt.updatePermission(selectedPermission.value.id, updateData as UpdatePermissionData)
      snackbar.success('Cập nhật quyền thành công')
    }
    permDialogOpen.value = false
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

async function confirmDeletePermission(perm: Permission) {
  const confirmed = await confirm(`Bạn có chắc muốn xóa quyền "${perm.name}" (${perm.code})?`)
  if (!confirmed) return

  try {
    await permMgmt.deletePermission(perm.id)
    snackbar.success('Xóa quyền thành công')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

// ============================================
// Tab 3: Employee Permissions
// ============================================
const employeeSearch = ref('')
const employeeOptions = ref<EmployeeSearchResult[]>([])
const selectedEmployee = ref<EmployeeSearchResult | null>(null)
const employeeData = ref<EmployeeRolesPermissions | null>(null)
const employeeRoleIds = ref<number[]>([])
const employeeDirectPerms = ref<Map<number, boolean>>(new Map())
const employeeLoading = ref(false)

async function filterEmployees(val: string, update: (fn: () => void) => void) {
  if (val.length < 2) {
    update(() => {
      employeeOptions.value = []
    })
    return
  }

  const results = await permMgmt.searchEmployees(val)
  update(() => {
    employeeOptions.value = results
  })
}

async function onEmployeeSelected(emp: EmployeeSearchResult | null) {
  if (!emp) {
    employeeData.value = null
    return
  }

  employeeLoading.value = true
  try {
    const data = await permMgmt.getEmployeeRolesPermissions(emp.id)
    employeeData.value = data

    if (data) {
      employeeRoleIds.value = data.roles.map((r) => r.id)
      employeeDirectPerms.value = new Map(
        data.directPermissions.map((dp) => [dp.permission.id, dp.granted])
      )
    }
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Không thể tải thông tin')
  } finally {
    employeeLoading.value = false
  }
}

function toggleEmployeeRole(roleId: number) {
  const idx = employeeRoleIds.value.indexOf(roleId)
  if (idx >= 0) {
    employeeRoleIds.value.splice(idx, 1)
  } else {
    employeeRoleIds.value.push(roleId)
  }
}

function setDirectPermGranted(permId: number, checked: boolean) {
  if (checked) {
    // Nếu check "Cấp quyền" → set granted = true
    employeeDirectPerms.value.set(permId, true)
  } else {
    // Nếu uncheck "Cấp quyền" → xóa override (không còn override)
    const current = employeeDirectPerms.value.get(permId)
    if (current === true) {
      employeeDirectPerms.value.delete(permId)
    }
  }
}

function setDirectPermDenied(permId: number, checked: boolean) {
  if (checked) {
    // Nếu check "Từ chối" → set granted = false
    employeeDirectPerms.value.set(permId, false)
  } else {
    // Nếu uncheck "Từ chối" → xóa override
    const current = employeeDirectPerms.value.get(permId)
    if (current === false) {
      employeeDirectPerms.value.delete(permId)
    }
  }
}

function isDirectPermGranted(permId: number): boolean {
  return employeeDirectPerms.value.get(permId) === true
}

function isDirectPermDenied(permId: number): boolean {
  return employeeDirectPerms.value.get(permId) === false
}

async function saveEmployeeRoles() {
  if (!selectedEmployee.value) return

  try {
    await permMgmt.updateEmployeeRoles(selectedEmployee.value.id, employeeRoleIds.value)
    snackbar.success('Cập nhật vai trò thành công')
    // Refresh data
    await onEmployeeSelected(selectedEmployee.value)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

async function saveEmployeePermissions() {
  if (!selectedEmployee.value) return

  const updates: { permissionId: number; granted: boolean }[] = []
  for (const [permId, granted] of employeeDirectPerms.value.entries()) {
    updates.push({ permissionId: permId, granted })
  }

  try {
    await permMgmt.updateEmployeePermissions(selectedEmployee.value.id, updates)
    snackbar.success('Cập nhật quyền thành công')
    // Refresh data
    await onEmployeeSelected(selectedEmployee.value)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(async () => {
  try {
    await permMgmt.initialize()
  } catch (err) {
    snackbar.error('Không thể tải dữ liệu phân quyền')
  }
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Phân Quyền"
      subtitle="Quản lý vai trò và quyền truy cập hệ thống"
    />

    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey q-mt-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab
        name="roles"
        label="Vai trò"
        icon="admin_panel_settings"
      />
      <q-tab
        name="permissions"
        label="Danh sách quyền"
        icon="security"
      />
      <q-tab
        name="employees"
        label="Phân quyền nhân viên"
        icon="people"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="activeTab"
      animated
      class="q-mt-md"
    >
      <!-- ============================================ -->
      <!-- Tab 1: Roles Management -->
      <!-- ============================================ -->
      <q-tab-panel
        name="roles"
        class="q-pa-none"
      >
        <AppCard>
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">
              Quản lý vai trò
            </div>
            <q-btn
              color="primary"
              icon="add"
              label="Thêm vai trò"
              @click="openCreateRoleDialog"
            />
          </q-card-section>

          <q-table
            :rows="permMgmt.roles.value"
            :columns="roleColumns"
            row-key="id"
            :loading="permMgmt.loading.value"
            flat
            bordered
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-isActive="props">
              <q-td :props="props">
                <q-chip
                  :color="props.row.isActive ? 'positive' : 'negative'"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ props.row.isActive ? 'Hoạt động' : 'Tắt' }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  @click="openEditRoleDialog(props.row)"
                >
                  <q-tooltip>Sửa</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  :disable="props.row.isSystem"
                  @click="confirmDeleteRole(props.row)"
                >
                  <q-tooltip>{{ props.row.isSystem ? 'Không thể xóa vai trò hệ thống' : 'Xóa' }}</q-tooltip>
                </q-btn>
              </q-td>
            </template>

            <template #no-data>
              <EmptyState
                icon="admin_panel_settings"
                title="Chưa có vai trò"
                description="Nhấn nút Thêm vai trò để tạo mới"
              />
            </template>
          </q-table>
        </AppCard>

        <!-- Role Create/Edit Dialog -->
        <q-dialog
          v-model="roleDialogOpen"
          persistent
        >
          <q-card style="min-width: 700px; max-width: 90vw">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">
                {{ roleDialogMode === 'create' ? 'Tạo vai trò mới' : 'Sửa vai trò' }}
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
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="roleForm.code"
                    label="Mã vai trò *"
                    :readonly="roleDialogMode === 'edit'"
                    outlined
                    dense
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="roleForm.name"
                    label="Tên vai trò *"
                    outlined
                    dense
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model.number="roleForm.level"
                    label="Cấp độ (0=cao nhất)"
                    type="number"
                    outlined
                    dense
                    :rules="[(v) => v >= 0 || 'Phải >= 0']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="roleForm.description"
                    label="Mô tả"
                    outlined
                    dense
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="text-subtitle1 q-mb-sm">
                Quyền của vai trò
              </div>
              <div style="max-height: 400px; overflow-y: auto">
                <q-list
                  bordered
                  separator
                >
                  <q-expansion-item
                    v-for="module in permMgmt.moduleList.value"
                    :key="module"
                    :label="module"
                    header-class="bg-grey-2"
                    expand-icon-class="text-primary"
                  >
                    <template #header>
                      <q-item-section avatar>
                        <q-checkbox
                          :model-value="isModuleAllSelected(module)"
                          :indeterminate="isModuleSomeSelected(module)"
                          @update:model-value="selectAllModulePermissions(module)"
                          @click.stop
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ module }}</q-item-label>
                        <q-item-label caption>
                          {{ (permMgmt.permissionsByModule.value[module] || []).length }} quyền
                        </q-item-label>
                      </q-item-section>
                    </template>

                    <q-card flat>
                      <q-card-section class="q-pt-none">
                        <div class="row q-col-gutter-sm">
                          <div
                            v-for="perm in permMgmt.permissionsByModule.value[module]"
                            :key="perm.id"
                            class="col-12 col-sm-6 col-md-4"
                          >
                            <q-checkbox
                              :model-value="isPermissionSelected(perm.id)"
                              :label="perm.name"
                              dense
                              @update:model-value="toggleRolePermission(perm.id)"
                            >
                              <q-tooltip v-if="perm.description">
                                {{ perm.description }}
                              </q-tooltip>
                            </q-checkbox>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </q-list>
              </div>
            </q-card-section>

            <q-card-actions
              align="right"
              class="q-pa-md"
            >
              <q-btn
                v-close-popup
                flat
                label="Hủy"
              />
              <q-btn
                color="primary"
                :label="roleDialogMode === 'create' ? 'Tạo' : 'Lưu'"
                :loading="permMgmt.loading.value"
                @click="saveRole"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- ============================================ -->
      <!-- Tab 2: Permissions List -->
      <!-- ============================================ -->
      <q-tab-panel
        name="permissions"
        class="q-pa-none"
      >
        <AppCard>
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <div class="text-h6">
                Danh sách quyền hệ thống
              </div>
            </div>
            <div class="col-12 col-sm-5">
              <q-input
                v-model="permissionFilter"
                placeholder="Tìm kiếm quyền..."
                outlined
                dense
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-3 text-right">
              <q-btn
                color="primary"
                icon="add"
                label="Thêm quyền"
                @click="openCreatePermissionDialog"
              />
            </div>
          </q-card-section>

          <q-list
            bordered
            separator
          >
            <q-expansion-item
              v-for="module in filteredModuleList"
              :key="module"
              :label="module"
              header-class="bg-grey-1 text-weight-medium"
              expand-icon-class="text-primary"
              default-opened
            >
              <template #header>
                <q-item-section avatar>
                  <q-icon
                    name="folder"
                    color="primary"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ module }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary">
                    {{ (filteredPermissionsByModule[module] || []).length }}
                  </q-badge>
                </q-item-section>
              </template>

              <q-table
                :rows="filteredPermissionsByModule[module] || []"
                :columns="[
                  { name: 'code', label: 'Mã quyền', field: 'code', align: 'left' },
                  { name: 'name', label: 'Tên quyền', field: 'name', align: 'left' },
                  { name: 'action', label: 'Hành động', field: 'action', align: 'center' },
                  { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
                  { name: 'routePath', label: 'Route', field: 'routePath', align: 'left' },
                  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
                ]"
                row-key="id"
                flat
                dense
                :pagination="{ rowsPerPage: 0 }"
                hide-pagination
              >
                <template #body-cell-action="props">
                  <q-td :props="props">
                    <q-chip
                      :color="
                        props.row.action === 'VIEW'
                          ? 'blue'
                          : props.row.action === 'CREATE'
                            ? 'green'
                            : props.row.action === 'EDIT'
                              ? 'orange'
                              : props.row.action === 'DELETE'
                                ? 'red'
                                : 'grey'
                      "
                      text-color="white"
                      size="sm"
                      dense
                    >
                      {{ props.row.action }}
                    </q-chip>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      flat
                      round
                      dense
                      color="primary"
                      icon="edit"
                      size="sm"
                      @click="openEditPermissionDialog(props.row)"
                    >
                      <q-tooltip>Sửa</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click="confirmDeletePermission(props.row)"
                    >
                      <q-tooltip>Xóa</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
              </q-table>
            </q-expansion-item>
          </q-list>

          <template v-if="filteredModuleList.length === 0">
            <EmptyState
              icon="search_off"
              title="Không tìm thấy quyền"
              :description="permissionFilter ? 'Thử từ khóa khác' : 'Chưa có quyền nào trong hệ thống'"
            />
          </template>
        </AppCard>

        <!-- Permission Create/Edit Dialog -->
        <q-dialog
          v-model="permDialogOpen"
          persistent
        >
          <q-card style="min-width: 600px; max-width: 90vw">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">
                {{ permDialogMode === 'create' ? 'Tạo quyền mới' : 'Sửa quyền' }}
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
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="permForm.code"
                    label="Mã quyền *"
                    :readonly="permDialogMode === 'edit'"
                    outlined
                    dense
                    hint="Ví dụ: module.resource.action"
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="permForm.name"
                    label="Tên quyền *"
                    outlined
                    dense
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="permForm.description"
                    label="Mô tả"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="permForm.module"
                    label="Module *"
                    :options="moduleFilterOptions"
                    outlined
                    dense
                    use-input
                    new-value-mode="add-unique"
                    :rules="[(v) => !!v || 'Bắt buộc']"
                    @filter="filterModuleOptions"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="permForm.resource"
                    label="Resource *"
                    outlined
                    dense
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="permForm.action"
                    label="Hành động *"
                    :options="actionOptions"
                    outlined
                    dense
                    :rules="[(v) => !!v || 'Bắt buộc']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="permForm.routePath"
                    label="Route path"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-toggle
                    v-model="permForm.isPageAccess"
                    label="Truy cập trang"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model.number="permForm.sortOrder"
                    label="Thứ tự"
                    type="number"
                    outlined
                    dense
                  />
                </div>
              </div>
            </q-card-section>

            <q-card-actions
              align="right"
              class="q-pa-md"
            >
              <q-btn
                v-close-popup
                flat
                label="Hủy"
              />
              <q-btn
                color="primary"
                :label="permDialogMode === 'create' ? 'Tạo' : 'Lưu'"
                :loading="permMgmt.loading.value"
                @click="savePermission"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- ============================================ -->
      <!-- Tab 3: Employee Permissions -->
      <!-- ============================================ -->
      <q-tab-panel
        name="employees"
        class="q-pa-none"
      >
        <AppCard>
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-h6">
                Phân quyền nhân viên
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedEmployee"
                :options="employeeOptions"
                option-label="fullName"
                option-value="id"
                label="Tìm nhân viên..."
                outlined
                dense
                use-input
                clearable
                @filter="filterEmployees"
                @update:model-value="onEmployeeSelected"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Nhập ít nhất 2 ký tự để tìm kiếm
                    </q-item-section>
                  </q-item>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar
                        color="primary"
                        text-color="white"
                        size="sm"
                      >
                        {{ scope.opt.fullName?.charAt(0) || '?' }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.fullName }}</q-item-label>
                      <q-item-label caption>
                        {{ scope.opt.employeeId }} - {{ scope.opt.department }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-card-section>

          <q-inner-loading :showing="employeeLoading" />

          <template v-if="!selectedEmployee">
            <EmptyState
              icon="person_search"
              title="Chọn nhân viên"
              description="Tìm và chọn nhân viên để xem và chỉnh sửa quyền"
            />
          </template>

          <template v-else-if="employeeData">
            <div class="q-pa-md">
              <!-- Employee Info -->
              <div class="row items-center q-mb-md q-col-gutter-md">
                <div class="col-auto">
                  <q-avatar
                    color="primary"
                    text-color="white"
                    size="56px"
                  >
                    {{ employeeData.employee.fullName?.charAt(0) || '?' }}
                  </q-avatar>
                </div>
                <div class="col">
                  <div class="text-h6">
                    {{ employeeData.employee.fullName }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ employeeData.employee.employeeId }} |
                    {{ employeeData.employee.department }} |
                    {{ employeeData.employee.chucVu }}
                  </div>
                </div>
                <div
                  v-if="employeeData.isRoot"
                  class="col-auto"
                >
                  <q-chip
                    color="deep-purple"
                    text-color="white"
                    icon="verified_user"
                  >
                    ROOT
                  </q-chip>
                </div>
              </div>

              <q-separator class="q-mb-md" />

              <!-- Roles Assignment -->
              <div class="text-subtitle1 q-mb-sm">
                <q-icon
                  name="admin_panel_settings"
                  class="q-mr-xs"
                />
                Vai trò
              </div>
              <div class="row q-col-gutter-sm q-mb-md">
                <div
                  v-for="role in permMgmt.roles.value"
                  :key="role.id"
                  class="col-12 col-sm-6 col-md-4"
                >
                  <q-checkbox
                    :model-value="employeeRoleIds.includes(role.id)"
                    :label="role.name"
                    :disable="role.code === 'ROOT'"
                    @update:model-value="toggleEmployeeRole(role.id)"
                  >
                    <q-tooltip v-if="role.description">
                      {{ role.description }}
                    </q-tooltip>
                  </q-checkbox>
                </div>
              </div>
              <q-btn
                color="primary"
                label="Lưu vai trò"
                icon="save"
                :loading="permMgmt.loading.value"
                class="q-mb-lg"
                @click="saveEmployeeRoles"
              />

              <q-separator class="q-mb-md" />

              <!-- Direct Permissions -->
              <div class="text-subtitle1 q-mb-sm">
                <q-icon
                  name="security"
                  class="q-mr-xs"
                />
                Quyền trực tiếp (override)
              </div>
              <div class="text-caption text-grey q-mb-md">
                Checkbox xanh = Cấp quyền | Checkbox đỏ = Từ chối | Cả hai trống = Kế thừa từ vai trò
              </div>

              <div style="max-height: 400px; overflow-y: auto">
                <q-list
                  bordered
                  separator
                >
                  <q-expansion-item
                    v-for="module in permMgmt.moduleList.value"
                    :key="module"
                    :label="module"
                    header-class="bg-grey-1"
                  >
                    <q-card flat>
                      <q-card-section class="q-pt-none">
                        <div class="row q-col-gutter-sm">
                          <div
                            v-for="perm in permMgmt.permissionsByModule.value[module]"
                            :key="perm.id"
                            class="col-12 col-sm-6 col-md-4"
                          >
                            <div
                              class="row items-center q-gutter-x-sm q-pa-xs rounded-borders"
                              :class="isDirectPermGranted(perm.id) ? 'bg-green-1' : isDirectPermDenied(perm.id) ? 'bg-red-1' : ''"
                            >
                              <div class="col-grow text-body2 ellipsis">
                                {{ perm.name }}
                                <q-tooltip v-if="perm.description">
                                  {{ perm.description }}
                                </q-tooltip>
                              </div>
                              <q-checkbox
                                :model-value="isDirectPermGranted(perm.id)"
                                color="positive"
                                dense
                                size="sm"
                                @update:model-value="(val: boolean) => setDirectPermGranted(perm.id, val)"
                              >
                                <q-tooltip>Cấp quyền</q-tooltip>
                              </q-checkbox>
                              <q-checkbox
                                :model-value="isDirectPermDenied(perm.id)"
                                color="negative"
                                dense
                                size="sm"
                                @update:model-value="(val: boolean) => setDirectPermDenied(perm.id, val)"
                              >
                                <q-tooltip>Từ chối</q-tooltip>
                              </q-checkbox>
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </q-list>
              </div>

              <q-btn
                color="primary"
                label="Lưu quyền trực tiếp"
                icon="save"
                :loading="permMgmt.loading.value"
                class="q-mt-md"
                @click="saveEmployeePermissions"
              />

              <q-separator class="q-my-md" />

              <!-- Effective Permissions Summary -->
              <div class="text-subtitle1 q-mb-sm">
                <q-icon
                  name="verified"
                  class="q-mr-xs"
                />
                Quyền hiệu lực (tổng hợp)
              </div>
              <div class="text-caption text-grey q-mb-md">
                Tổng hợp quyền từ vai trò + quyền trực tiếp
              </div>
              <div class="row q-col-gutter-xs">
                <div
                  v-for="permCode in employeeData.effectivePermissions"
                  :key="permCode"
                  class="col-auto"
                >
                  <q-chip
                    size="sm"
                    color="primary"
                    text-color="white"
                    dense
                  >
                    {{ permCode }}
                  </q-chip>
                </div>
              </div>
              <div
                v-if="employeeData.effectivePermissions.length === 0"
                class="text-grey"
              >
                Không có quyền nào
              </div>
            </div>
          </template>
        </AppCard>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

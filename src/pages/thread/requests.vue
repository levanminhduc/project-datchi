<script setup lang="ts">
/**
 * Thread Requests Page
 *
 * Quản lý yêu cầu chỉ từ xưởng sản xuất
 * Workflow: PENDING -> APPROVED -> READY_FOR_PICKUP -> RECEIVED
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar, date } from 'quasar'
import { useThreadRequests, useWarehouses, useThreadTypes, useConfirm } from '@/composables'
import AllocationStatusBadge from '@/components/thread/AllocationStatusBadge.vue'
import type { Allocation, CreateAllocationDTO } from '@/types/thread'
import { AllocationStatus, AllocationPriority } from '@/types/thread/enums'

const $q = useQuasar()
const { confirm: confirmDialog } = useConfirm()

// Composables
const {
  requests,
  isLoading,
  pendingCount,
  readyForPickupCount,
  fetchRequests,
  createRequest,
  approve,
  reject,
  markReady,
  confirmReceived,
  cancelRequest,
} = useThreadRequests()

const { storageWarehouses, fetchWarehouses } = useWarehouses()
const { threadTypes, fetchThreadTypes } = useThreadTypes()

// State
const activeTab = ref<'all' | 'pending' | 'approved' | 'ready' | 'completed'>('all')
const search = ref('')
const showCreateDialog = ref(false)
const showRejectDialog = ref(false)
const selectedRequest = ref<Allocation | null>(null)
const rejectReason = ref('')

// Create form
const createForm = ref<CreateAllocationDTO>({
  order_id: '',
  thread_type_id: 0,
  requested_meters: 0,
  priority: AllocationPriority.NORMAL,
  requesting_warehouse_id: undefined,
  source_warehouse_id: undefined,
  requested_by: '',
})

// Pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 15,
  sortBy: 'created_at',
  descending: true,
})

// Table columns
const columns = [
  { name: 'id', label: 'Mã', field: 'id', sortable: true, align: 'left' as const },
  { name: 'order_id', label: 'Mã đơn hàng', field: 'order_id', sortable: true, align: 'left' as const },
  {
    name: 'thread_type',
    label: 'Loại chỉ',
    field: (row: Allocation) => row.thread_type?.name || '-',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'requested_meters',
    label: 'Số mét',
    field: 'requested_meters',
    sortable: true,
    align: 'right' as const,
    format: (val: number) => val.toLocaleString('vi-VN'),
  },
  {
    name: 'requesting_warehouse',
    label: 'Xưởng yêu cầu',
    field: (row: Allocation) => row.requesting_warehouse?.name || '-',
    sortable: false,
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Trạng thái',
    field: 'status',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'created_at',
    label: 'Ngày tạo',
    field: 'created_at',
    sortable: true,
    align: 'left' as const,
    format: (val: string) => date.formatDate(val, 'DD/MM/YYYY HH:mm'),
  },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

// Computed
const filteredRequests = computed(() => {
  let result = [...requests.value]

  // Filter by tab
  if (activeTab.value === 'pending') {
    result = result.filter((r) => r.status === AllocationStatus.PENDING)
  } else if (activeTab.value === 'approved') {
    result = result.filter((r) => r.status === AllocationStatus.APPROVED)
  } else if (activeTab.value === 'ready') {
    result = result.filter((r) => r.status === AllocationStatus.READY_FOR_PICKUP)
  } else if (activeTab.value === 'completed') {
    result = result.filter(
      (r) =>
        r.status === AllocationStatus.RECEIVED ||
        r.status === AllocationStatus.REJECTED ||
        r.status === AllocationStatus.CANCELLED
    )
  }

  // Filter by search
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.order_id.toLowerCase().includes(s) ||
        r.thread_type?.name?.toLowerCase().includes(s) ||
        r.requesting_warehouse?.name?.toLowerCase().includes(s)
    )
  }

  return result
})

const priorityOptions = [
  { label: 'Thấp', value: AllocationPriority.LOW },
  { label: 'Bình thường', value: AllocationPriority.NORMAL },
  { label: 'Cao', value: AllocationPriority.HIGH },
  { label: 'Khẩn cấp', value: AllocationPriority.URGENT },
]

// Actions
async function handleApprove(row: Allocation) {
  const ok = await confirmDialog('Xác nhận duyệt yêu cầu này?')
  if (ok) {
    await approve(row.id, 'Admin') // TODO: Get current user
  }
}

function openRejectDialog(row: Allocation) {
  selectedRequest.value = row
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function handleReject() {
  if (!selectedRequest.value || !rejectReason.value.trim()) {
    $q.notify({ type: 'warning', message: 'Vui lòng nhập lý do từ chối' })
    return
  }
  await reject(selectedRequest.value.id, 'Admin', rejectReason.value)
  showRejectDialog.value = false
  selectedRequest.value = null
}

async function handleMarkReady(row: Allocation) {
  const ok = await confirmDialog('Xác nhận đã chuẩn bị xong chỉ cho yêu cầu này?')
  if (ok) {
    await markReady(row.id)
  }
}

async function handleReceive(row: Allocation) {
  const ok = await confirmDialog('Xác nhận đã nhận chỉ?')
  if (ok) {
    await confirmReceived(row.id, 'Admin') // TODO: Get current user
  }
}

async function handleCancel(row: Allocation) {
  const ok = await confirmDialog('Xác nhận hủy yêu cầu này?')
  if (ok) {
    await cancelRequest(row.id)
  }
}

function openCreateDialog() {
  createForm.value = {
    order_id: '',
    thread_type_id: 0,
    requested_meters: 0,
    priority: AllocationPriority.NORMAL,
    requesting_warehouse_id: undefined,
    source_warehouse_id: undefined,
    requested_by: '',
  }
  showCreateDialog.value = true
}

async function handleCreate() {
  if (!createForm.value.order_id || !createForm.value.thread_type_id || !createForm.value.requested_meters) {
    $q.notify({ type: 'warning', message: 'Vui lòng điền đầy đủ thông tin' })
    return
  }
  const created = await createRequest(createForm.value)
  if (created) {
    showCreateDialog.value = false
  }
}

// Determine which actions are available
function canApprove(row: Allocation): boolean {
  return row.status === AllocationStatus.PENDING
}

function canReject(row: Allocation): boolean {
  return row.status === AllocationStatus.PENDING
}

function canMarkReady(row: Allocation): boolean {
  return row.status === AllocationStatus.APPROVED
}

function canReceive(row: Allocation): boolean {
  return row.status === AllocationStatus.READY_FOR_PICKUP
}

function canCancel(row: Allocation): boolean {
  return row.status === AllocationStatus.PENDING || row.status === AllocationStatus.APPROVED
}

// Watch tab change
watch(activeTab, () => {
  pagination.value.page = 1
})

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchRequests(), fetchWarehouses(), fetchThreadTypes()])
})
</script>

<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none">
          Yêu Cầu Chỉ
        </h5>
        <p class="text-grey-7 q-mb-none">
          Quản lý yêu cầu chỉ từ xưởng sản xuất
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Tạo yêu cầu"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
    >
      <q-tab
        name="all"
        label="Tất cả"
      />
      <q-tab name="pending">
        <template #default>
          Chờ duyệt
          <q-badge
            v-if="pendingCount > 0"
            color="orange"
            floating
          >
            {{ pendingCount }}
          </q-badge>
        </template>
      </q-tab>
      <q-tab
        name="approved"
        label="Đã duyệt"
      />
      <q-tab name="ready">
        <template #default>
          Sẵn sàng nhận
          <q-badge
            v-if="readyForPickupCount > 0"
            color="green"
            floating
          >
            {{ readyForPickupCount }}
          </q-badge>
        </template>
      </q-tab>
      <q-tab
        name="completed"
        label="Hoàn thành"
      />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <!-- Search -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Tìm kiếm..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Table -->
    <q-table
      v-model:pagination="pagination"
      :rows="filteredRequests"
      :columns="columns"
      :loading="isLoading"
      row-key="id"
      flat
      bordered
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <AllocationStatusBadge :status="props.row.status" />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td
          :props="props"
          class="q-gutter-xs"
        >
          <q-btn
            v-if="canApprove(props.row)"
            size="sm"
            color="positive"
            icon="check"
            dense
            round
            @click="handleApprove(props.row)"
          >
            <q-tooltip>Duyệt</q-tooltip>
          </q-btn>

          <q-btn
            v-if="canReject(props.row)"
            size="sm"
            color="negative"
            icon="close"
            dense
            round
            @click="openRejectDialog(props.row)"
          >
            <q-tooltip>Từ chối</q-tooltip>
          </q-btn>

          <q-btn
            v-if="canMarkReady(props.row)"
            size="sm"
            color="amber"
            icon="inventory"
            dense
            round
            @click="handleMarkReady(props.row)"
          >
            <q-tooltip>Đánh dấu sẵn sàng</q-tooltip>
          </q-btn>

          <q-btn
            v-if="canReceive(props.row)"
            size="sm"
            color="green"
            icon="done_all"
            dense
            round
            @click="handleReceive(props.row)"
          >
            <q-tooltip>Xác nhận nhận</q-tooltip>
          </q-btn>

          <q-btn
            v-if="canCancel(props.row)"
            size="sm"
            color="grey"
            icon="cancel"
            dense
            round
            flat
            @click="handleCancel(props.row)"
          >
            <q-tooltip>Hủy</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width row flex-center text-grey q-py-xl">
          <q-icon
            name="inbox"
            size="3em"
            class="q-mr-sm"
          />
          <span>Không có yêu cầu nào</span>
        </div>
      </template>
    </q-table>

    <!-- Create Dialog -->
    <q-dialog
      v-model="showCreateDialog"
      persistent
    >
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <div class="text-h6">
            Tạo Yêu Cầu Chỉ
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

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="createForm.order_id"
            label="Mã đơn hàng *"
            outlined
            dense
          />

          <q-select
            v-model="createForm.thread_type_id"
            :options="threadTypes"
            option-value="id"
            :option-label="(item: { code: string; name: string }) => `${item.code} - ${item.name}`"
            label="Loại chỉ *"
            outlined
            dense
            emit-value
            map-options
            :rules="[(v) => !!v || 'Vui lòng chọn loại chỉ']"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-avatar
                    v-if="opt.color_data?.hex_code"
                    size="24px"
                    :style="{ backgroundColor: opt.color_data.hex_code }"
                  />
                  <q-icon
                    v-else
                    name="circle"
                    size="24px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ opt.code }} - {{ opt.name }}</q-item-label>
                  <q-item-label caption>
                    {{ opt.material }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model.number="createForm.requested_meters"
            label="Số mét yêu cầu *"
            type="number"
            outlined
            dense
            suffix="m"
          />

          <q-select
            v-model="createForm.priority"
            :options="priorityOptions"
            label="Mức ưu tiên"
            outlined
            dense
            emit-value
            map-options
          />

          <q-select
            v-model="createForm.requesting_warehouse_id"
            :options="storageWarehouses"
            option-value="id"
            option-label="name"
            label="Xưởng yêu cầu"
            outlined
            dense
            emit-value
            map-options
            clearable
          />

          <q-select
            v-model="createForm.source_warehouse_id"
            :options="storageWarehouses"
            option-value="id"
            option-label="name"
            label="Kho nguồn (tùy chọn)"
            outlined
            dense
            emit-value
            map-options
            clearable
          />

          <q-input
            v-model="createForm.requested_by"
            label="Người yêu cầu"
            outlined
            dense
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            label="Hủy"
            flat
          />
          <q-btn
            label="Tạo yêu cầu"
            color="primary"
            :loading="isLoading"
            @click="handleCreate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Reject Dialog -->
    <q-dialog
      v-model="showRejectDialog"
      persistent
    >
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            Từ Chối Yêu Cầu
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="rejectReason"
            label="Lý do từ chối *"
            type="textarea"
            outlined
            autogrow
            :rules="[(v) => !!v || 'Vui lòng nhập lý do']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            label="Hủy"
            flat
          />
          <q-btn
            label="Từ chối"
            color="negative"
            :loading="isLoading"
            @click="handleReject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

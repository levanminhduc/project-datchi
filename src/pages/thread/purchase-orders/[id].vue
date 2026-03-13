<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.back()"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">
          {{ purchaseOrder?.po_number || 'Chi tiết PO' }}
        </h1>
        <div
          v-if="purchaseOrder"
          class="text-grey-6"
        >
          {{ purchaseOrder.customer_name || 'Chưa có khách hàng' }}
        </div>
      </div>
      <q-space />
      <q-badge
        v-if="purchaseOrder"
        :color="getStatusColor(purchaseOrder.status)"
        :label="getStatusLabel(purchaseOrder.status)"
        class="text-body2 q-pa-sm"
      />
    </div>

    <div
      v-if="loading"
      class="row justify-center q-py-xl"
    >
      <q-spinner
        size="lg"
        color="primary"
      />
    </div>

    <template v-else-if="purchaseOrder">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Thông tin đơn hàng
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Số PO
                  </div>
                  <div class="text-body1">
                    {{ purchaseOrder.po_number }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Khách hàng
                  </div>
                  <div class="text-body1">
                    {{ purchaseOrder.customer_name || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Week
                  </div>
                  <div class="text-body1">
                    {{ purchaseOrder.week || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ngày đặt
                  </div>
                  <div class="text-body1">
                    {{ formatDate(purchaseOrder.order_date) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ngày giao
                  </div>
                  <div class="text-body1">
                    {{ formatDate(purchaseOrder.delivery_date) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ưu tiên
                  </div>
                  <div class="text-body1">
                    <q-badge
                      :color="getPriorityColor(purchaseOrder.priority)"
                      :label="getPriorityLabel(purchaseOrder.priority)"
                      outline
                    />
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ghi chú
                  </div>
                  <div class="text-body1">
                    {{ purchaseOrder.notes || '-' }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Tổng quan
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-h4 text-primary">
                    {{ items.length }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Mã hàng
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-h4">
                    {{ totalQuantity }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Tổng SL SP
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card
        flat
        bordered
      >
        <q-card-section class="row items-center">
          <div class="text-subtitle1 text-weight-medium">
            Danh sách mã hàng
          </div>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Thêm"
            unelevated
            @click="showAddItemDialog = true"
          />
        </q-card-section>

        <q-table
          flat
          :rows="items"
          :columns="itemColumns"
          :loading="loadingItems"
          row-key="id"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template #body-cell-style_code="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.style?.style_code }}</span>
            </q-td>
          </template>

          <template #body-cell-style_name="props">
            <q-td :props="props">
              {{ props.row.style?.style_name || '-' }}
            </q-td>
          </template>

          <template #body-cell-finished_product_code="props">
            <q-td :props="props">
              {{ props.row.finished_product_code || '-' }}
            </q-td>
          </template>

          <template #body-cell-quantity="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.quantity }}</span>
              <q-popup-edit
                v-slot="scope"
                v-model="editingQuantity"
                auto-save
                @before-show="editingQuantity = props.row.quantity"
                @save="(val) => updateItemQuantity(props.row.id, val)"
              >
                <q-input
                  v-model.number="scope.value"
                  type="number"
                  dense
                  autofocus
                  @keyup.enter="scope.set"
                />
              </q-popup-edit>
              <q-icon
                name="edit"
                size="xs"
                class="q-ml-xs text-grey-5 cursor-pointer"
              />
            </q-td>
          </template>

          <template #body-cell-ordered_quantity="props">
            <q-td :props="props">
              {{ props.row.ordered_quantity || 0 }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td
              :props="props"
              class="q-gutter-xs"
            >
              <q-btn
                flat
                round
                dense
                icon="history"
                color="info"
                @click="showHistory(props.row)"
              >
                <q-tooltip>Lịch sử</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDeleteItem(props.row)"
              >
                <q-tooltip>Xóa</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </template>

    <template v-else>
      <q-banner class="bg-negative text-white">
        Không tìm thấy đơn hàng
      </q-banner>
    </template>

    <AddPOItemDialog
      v-model="showAddItemDialog"
      :po-id="poId"
      :existing-style-ids="existingStyleIds"
      @saved="onItemAdded"
    />

    <POItemHistoryDialog
      v-model="showHistoryDialog"
      :po-id="poId"
      :item="selectedItem"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import AddPOItemDialog from '@/components/thread/AddPOItemDialog.vue'
import POItemHistoryDialog from '@/components/thread/POItemHistoryDialog.vue'
import { POStatus } from '@/types/thread/enums'
import type { PurchaseOrderWithItems, POItem } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.purchase-orders.view'],
  },
})

const route = useRoute('/thread/purchase-orders/[id]')
const snackbar = useSnackbar()
const { confirm } = useConfirm()

const poId = computed(() => Number(route.params.id))
const purchaseOrder = ref<PurchaseOrderWithItems | null>(null)
const items = ref<POItem[]>([])
const loading = ref(false)
const loadingItems = ref(false)
const showAddItemDialog = ref(false)
const showHistoryDialog = ref(false)
const selectedItem = ref<POItem | null>(null)
const editingQuantity = ref(0)

const totalQuantity = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
const existingStyleIds = computed(() => items.value.map(item => item.style_id))

const itemColumns = [
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' as const },
  { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' as const },
  { name: 'finished_product_code', label: 'Mã TP KT', field: 'finished_product_code', align: 'left' as const },
  { name: 'quantity', label: 'SL SP', field: 'quantity', align: 'center' as const },
  { name: 'ordered_quantity', label: 'Đã đặt', field: 'ordered_quantity', align: 'center' as const },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const }
]

function getStatusColor(status: POStatus): string {
  const colors: Record<POStatus, string> = {
    [POStatus.PENDING]: 'grey',
    [POStatus.CONFIRMED]: 'info',
    [POStatus.IN_PRODUCTION]: 'warning',
    [POStatus.COMPLETED]: 'positive',
    [POStatus.CANCELLED]: 'negative'
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: POStatus): string {
  const labels: Record<POStatus, string> = {
    [POStatus.PENDING]: 'Chờ xử lý',
    [POStatus.CONFIRMED]: 'Đã xác nhận',
    [POStatus.IN_PRODUCTION]: 'Đang SX',
    [POStatus.COMPLETED]: 'Hoàn thành',
    [POStatus.CANCELLED]: 'Đã hủy'
  }
  return labels[status] || status
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'grey',
    NORMAL: 'primary',
    HIGH: 'warning',
    URGENT: 'negative'
  }
  return colors[priority] || 'grey'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Thấp',
    NORMAL: 'Bình thường',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  }
  return labels[priority] || priority
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

async function loadPO() {
  loading.value = true
  try {
    const data = await purchaseOrderService.getWithItems(poId.value)
    purchaseOrder.value = data
    items.value = data.items || []
  } catch {
    purchaseOrder.value = null
  } finally {
    loading.value = false
  }
}

async function updateItemQuantity(itemId: number, newQuantity: number) {
  if (!newQuantity || newQuantity <= 0) {
    snackbar.error('Số lượng phải lớn hơn 0')
    return
  }

  try {
    await purchaseOrderService.updateItem(poId.value, itemId, { quantity: newQuantity })
    snackbar.success('Cập nhật số lượng thành công')
    loadPO()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể cập nhật số lượng')
  }
}

async function confirmDeleteItem(item: POItem) {
  const confirmed = await confirm({
    title: `Xóa mã hàng ${item.style?.style_code}?`,
    message: 'Mã hàng sẽ bị xóa khỏi đơn hàng này.',
    ok: 'Xóa',
    type: 'warning'
  })

  if (confirmed) {
    try {
      await purchaseOrderService.deleteItem(poId.value, item.id)
      snackbar.success('Xóa mã hàng thành công')
      loadPO()
    } catch (err) {
      snackbar.error((err as Error).message || 'Không thể xóa mã hàng')
    }
  }
}

function showHistory(item: POItem) {
  selectedItem.value = item
  showHistoryDialog.value = true
}

function onItemAdded() {
  showAddItemDialog.value = false
  loadPO()
}

onMounted(() => {
  loadPO()
})
</script>

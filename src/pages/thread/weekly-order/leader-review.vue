<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.push('/thread/weekly-order')"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Ký Duyệt Đơn Hàng
        </h1>
        <div class="text-grey-6">
          Danh sách đơn hàng tuần chờ lãnh đạo ký duyệt
        </div>
      </div>
      <q-space />
      <AppButton
        flat
        icon="refresh"
        label="Tải lại"
        @click="handleRefresh"
      />
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey q-mb-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
      no-caps
    >
      <q-tab
        name="pending"
        label="D/S Đơn Chờ Duyệt"
        icon="o_pending_actions"
      />
      <q-tab
        name="signed"
        label="D/S Đơn Đã Duyệt"
        icon="o_verified"
      />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels
      v-model="activeTab"
      animated
    >
      <q-tab-panel
        name="pending"
        class="q-pa-none"
      >
        <div
          v-if="loading"
          class="text-center q-pa-xl"
        >
          <q-spinner
            size="40px"
            color="primary"
          />
          <div class="q-mt-sm text-grey-6">
            Đang tải...
          </div>
        </div>

        <div
          v-else-if="orders.length === 0"
          class="text-center q-pa-xl"
        >
          <q-icon
            name="o_check_circle"
            size="64px"
            color="positive"
          />
          <div class="text-h6 q-mt-md text-grey-7">
            Không có đơn hàng nào chờ ký duyệt
          </div>
        </div>

        <template v-else>
          <div class="column q-gutter-md">
            <q-card
              v-for="order in orders"
              :key="order.id"
              flat
              bordered
            >
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-bold">
                      {{ order.week_name }}
                    </div>
                    <div class="text-caption text-grey-7">
                      Người đặt: {{ order.created_by || '—' }} · {{ formatDate(order.created_at) }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ order.item_count }} PO/Style · {{ order.summary_preview.length }} loại chỉ cần đặt
                    </div>
                  </div>
                  <div class="col-auto row q-gutter-sm">
                    <AppBadge
                      label="Đã xác nhận"
                      color="positive"
                    />
                    <AppButton
                      color="primary"
                      icon="o_approval"
                      label="Ký Duyệt"
                      @click="confirmSign(order)"
                    />
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-expansion-item
                v-if="order.items && order.items.length > 0"
                :label="`Chi tiết PO/Style (${order.items.length} dòng)`"
                dense
                header-class="text-weight-medium"
              >
                <q-card-section class="q-pt-none">
                  <q-table
                    :rows="order.items"
                    :columns="itemColumns"
                    row-key="id"
                    flat
                    bordered
                    dense
                    hide-pagination
                    :rows-per-page-options="[0]"
                  />
                </q-card-section>
              </q-expansion-item>

              <q-expansion-item
                :label="`Bảng tổng hợp (${order.summary_preview.length} loại chỉ)`"
                dense
                header-class="text-weight-medium"
              >
                <q-card-section class="q-pt-none">
                  <ResultsSummaryTable
                    :rows="order.summary_preview"
                    readonly
                  />
                </q-card-section>
              </q-expansion-item>
            </q-card>
          </div>

          <div
            v-if="pendingTotalPages > 1"
            class="flex justify-center q-mt-md"
          >
            <q-pagination
              v-model="pendingPage"
              :max="pendingTotalPages"
              :max-pages="7"
              direction-links
              boundary-links
              @update:model-value="onPendingPageChange"
            />
          </div>
        </template>
      </q-tab-panel>

      <q-tab-panel
        name="signed"
        class="q-pa-none"
      >
        <div
          v-if="loadingSigned"
          class="text-center q-pa-xl"
        >
          <q-spinner
            size="40px"
            color="primary"
          />
          <div class="q-mt-sm text-grey-6">
            Đang tải...
          </div>
        </div>

        <div
          v-else-if="signedOrders.length === 0"
          class="text-center q-pa-xl"
        >
          <q-icon
            name="o_info"
            size="64px"
            color="grey-5"
          />
          <div class="text-h6 q-mt-md text-grey-7">
            Chưa có đơn hàng nào được ký duyệt
          </div>
        </div>

        <template v-else>
          <div class="column q-gutter-md">
            <q-card
              v-for="order in signedOrders"
              :key="order.id"
              flat
              bordered
            >
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-bold">
                      {{ order.week_name }}
                    </div>
                    <div class="text-caption text-grey-7">
                      Người đặt: {{ order.created_by || '—' }} · {{ formatDate(order.created_at) }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ order.item_count }} PO/Style · {{ order.summary_preview.length }} loại chỉ cần đặt
                    </div>
                    <div class="text-caption text-positive q-mt-xs">
                      Người ký: {{ order.leader_signed_by_name || '—' }} · {{ formatDate(order.leader_signed_at || '') }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <AppBadge
                      label="Đã ký duyệt"
                      color="positive"
                    />
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-expansion-item
                v-if="order.items && order.items.length > 0"
                :label="`Chi tiết PO/Style (${order.items.length} dòng)`"
                dense
                header-class="text-weight-medium"
              >
                <q-card-section class="q-pt-none">
                  <q-table
                    :rows="order.items"
                    :columns="itemColumns"
                    row-key="id"
                    flat
                    bordered
                    dense
                    hide-pagination
                    :rows-per-page-options="[0]"
                  />
                </q-card-section>
              </q-expansion-item>

              <q-expansion-item
                :label="`Bảng tổng hợp (${order.summary_preview.length} loại chỉ)`"
                dense
                header-class="text-weight-medium"
              >
                <q-card-section class="q-pt-none">
                  <ResultsSummaryTable
                    :rows="order.summary_preview"
                    readonly
                  />
                </q-card-section>
              </q-expansion-item>
            </q-card>
          </div>

          <div
            v-if="signedTotalPages > 1"
            class="flex justify-center q-mt-md"
          >
            <q-pagination
              v-model="signedPage"
              :max="signedTotalPages"
              :max-pages="7"
              direction-links
              boundary-links
              @update:model-value="onSignedPageChange"
            />
          </div>
        </template>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="showConfirmDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            Xác nhận ký duyệt
          </div>
        </q-card-section>
        <q-card-section>
          Bạn chắc chắn muốn ký duyệt đơn hàng tuần <strong>{{ signingOrder?.week_name }}</strong>?
        </q-card-section>
        <q-card-actions align="right">
          <AppButton
            flat
            label="Hủy"
            @click="showConfirmDialog = false"
          />
          <AppButton
            color="primary"
            label="Ký Duyệt"
            :loading="signing"
            @click="handleSign"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import { weeklyOrderService, type LeaderReviewItem } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import ResultsSummaryTable from '@/components/thread/weekly-order/ResultsSummaryTable.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.leader.sign'],
  },
})

const PAGE_SIZE = 10

const snackbar = useSnackbar()
const activeTab = ref('pending')
const loading = ref(false)
const orders = ref<LeaderReviewItem[]>([])
const signedOrders = ref<LeaderReviewItem[]>([])
const loadingSigned = ref(false)
const showConfirmDialog = ref(false)
const signingOrder = ref<LeaderReviewItem | null>(null)
const signing = ref(false)

const pendingPage = ref(1)
const pendingTotalPages = ref(0)
const signedPage = ref(1)
const signedTotalPages = ref(0)
const signedLoaded = ref(false)

const itemColumns: QTableColumn[] = [
  { name: 'po', label: 'PO', field: (row: any) => row.po?.po_number || '—', align: 'left' },
  { name: 'style', label: 'Style', field: (row: any) => row.style?.style_code || '—', align: 'left' },
  { name: 'style_color', label: 'Màu', field: (row: any) => row.style_color?.color_name || '—', align: 'left' },
  { name: 'quantity', label: 'Số lượng', field: 'quantity', align: 'right', format: (v: number) => v?.toLocaleString('vi-VN') || '—' },
]

async function fetchData(page = pendingPage.value) {
  loading.value = true
  try {
    const result = await weeklyOrderService.getLeaderReview({ page, limit: PAGE_SIZE })
    orders.value = result.data
    pendingTotalPages.value = result.pagination.totalPages
    pendingPage.value = result.pagination.page

    if (orders.value.length === 0 && pendingPage.value > 1) {
      pendingPage.value = 1
      await fetchData(1)
    }
  } catch (err) {
    snackbar.error('Không thể tải danh sách đơn hàng')
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchSignedData(page = signedPage.value) {
  loadingSigned.value = true
  try {
    const result = await weeklyOrderService.getLeaderReview({ signed: true, page, limit: PAGE_SIZE })
    signedOrders.value = result.data
    signedTotalPages.value = result.pagination.totalPages
    signedPage.value = result.pagination.page
    signedLoaded.value = true
  } catch (err) {
    snackbar.error('Không thể tải danh sách đơn đã duyệt')
    console.error(err)
  } finally {
    loadingSigned.value = false
  }
}

function onPendingPageChange(page: number) {
  fetchData(page)
}

function onSignedPageChange(page: number) {
  fetchSignedData(page)
}

function handleRefresh() {
  if (activeTab.value === 'pending') {
    fetchData()
  } else {
    fetchSignedData()
  }
}

function confirmSign(order: LeaderReviewItem) {
  signingOrder.value = order
  showConfirmDialog.value = true
}

async function handleSign() {
  if (!signingOrder.value) return
  signing.value = true
  try {
    await weeklyOrderService.leaderSign(signingOrder.value.id)
    snackbar.success('Đã ký duyệt thành công')
    showConfirmDialog.value = false
    await fetchData()
    if (signedLoaded.value) {
      fetchSignedData()
    }
  } catch (err: any) {
    snackbar.error(err.message || 'Ký duyệt thất bại')
  } finally {
    signing.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

watch(activeTab, (tab) => {
  if (tab === 'signed' && !signedLoaded.value) {
    fetchSignedData(1)
  }
})

onMounted(() => fetchData(1))
</script>

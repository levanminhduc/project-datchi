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

    <div
      class="q-mb-md leader-review-search"
      style="max-width: 360px;"
    >
      <AppInput
        v-model="searchQuery"
        aria-label="Tìm kiếm đơn hàng tuần"
        dense
        clearable
        class="leader-review-search__field"
        hide-bottom-space
        @focus="searchFocused = true"
        @blur="searchFocused = false"
        @update:model-value="onSearchInput"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </AppInput>
      <Transition
        name="rotating-placeholder"
        mode="out-in"
      >
        <span
          v-if="shouldShowSearchPlaceholder"
          :key="rotatingSearchPlaceholder"
          class="leader-review-search__placeholder"
        >
          {{ rotatingSearchPlaceholder }}
        </span>
      </Transition>
    </div>

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
          <div
            class="column q-gutter-md"
            style="min-width: 0;"
          >
            <q-card
              v-for="order in orders"
              :key="order.id"
              flat
              bordered
              style="overflow: hidden; max-width: 100%; min-width: 0;"
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
                    <q-btn-dropdown
                      flat
                      dense
                      color="primary"
                      icon="file_download"
                      label="Xuất Excel"
                      no-caps
                    >
                      <q-list dense>
                        <q-item
                          v-close-popup
                          clickable
                          @click="handleExportAll(order)"
                        >
                          <q-item-section avatar>
                            <q-icon
                              name="o_list_alt"
                              color="primary"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Xuất tất cả</q-item-label>
                            <q-item-label caption>
                              {{ order.summary_all.length }} loại chỉ
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-close-popup
                          clickable
                          @click="handleExportFiltered(order)"
                        >
                          <q-item-section avatar>
                            <q-icon
                              name="o_filter_alt"
                              color="positive"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Xuất chỉ cần đặt</q-item-label>
                            <q-item-label caption>
                              {{ order.summary_preview.length }} loại chỉ
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
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
                  <div style="overflow-x: auto; max-width: 100%;">
                    <ResultsSummaryTable
                      :rows="order.summary_preview"
                      readonly
                    />
                  </div>
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
          <div
            class="column q-gutter-md"
            style="min-width: 0;"
          >
            <q-card
              v-for="order in signedOrders"
              :key="order.id"
              flat
              bordered
              style="overflow: hidden; max-width: 100%; min-width: 0;"
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
                  <div class="col-auto row q-gutter-sm">
                    <AppBadge
                      label="Đã ký duyệt"
                      color="positive"
                    />
                    <q-btn-dropdown
                      flat
                      dense
                      color="primary"
                      icon="file_download"
                      label="Xuất Excel"
                      no-caps
                    >
                      <q-list dense>
                        <q-item
                          v-close-popup
                          clickable
                          @click="handleExportAll(order)"
                        >
                          <q-item-section avatar>
                            <q-icon
                              name="o_list_alt"
                              color="primary"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Xuất tất cả</q-item-label>
                            <q-item-label caption>
                              {{ order.summary_all.length }} loại chỉ
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-close-popup
                          clickable
                          @click="handleExportFiltered(order)"
                        >
                          <q-item-section avatar>
                            <q-icon
                              name="o_filter_alt"
                              color="positive"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Xuất chỉ cần đặt</q-item-label>
                            <q-item-label caption>
                              {{ order.summary_preview.length }} loại chỉ
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
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
                  <div style="overflow-x: auto; max-width: 100%;">
                    <ResultsSummaryTable
                      :rows="order.summary_preview"
                      readonly
                    />
                  </div>
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import { weeklyOrderService, type LeaderReviewItem } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import ResultsSummaryTable from '@/components/thread/weekly-order/ResultsSummaryTable.vue'
import { exportOrderResults, type ExportWeekMeta } from '@/composables/thread/useWeeklyOrderExport'

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
const searchQuery = ref('')
const searchFocused = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null
const searchPlaceholders = ['Nhập thông tin tuần hàng', 'Nhập thông tin đơn hàng']
const searchPlaceholderIndex = ref(0)
const rotatingSearchPlaceholder = computed(() => searchPlaceholders[searchPlaceholderIndex.value])
const shouldShowSearchPlaceholder = computed(() => searchQuery.value.length === 0 && !searchFocused.value)
let searchPlaceholderTimer: ReturnType<typeof setInterval> | null = null

const itemColumns: QTableColumn[] = [
  { name: 'po', label: 'PO', field: (row: any) => row.po?.po_number || '—', align: 'left' },
  { name: 'style', label: 'Style', field: (row: any) => row.style?.style_code || '—', align: 'left' },
  { name: 'style_color', label: 'Màu', field: (row: any) => row.style_color?.color_name || '—', align: 'left' },
  { name: 'quantity', label: 'Số lượng', field: 'quantity', align: 'right', format: (v: number) => v?.toLocaleString('vi-VN') || '—' },
]

function buildWeekMeta(order: LeaderReviewItem): ExportWeekMeta {
  return {
    id: order.id,
    week_name: order.week_name,
    created_by: order.created_by,
    created_at: order.created_at,
    leader_signed_by_name: order.leader_signed_by_name,
    leader_signed_at: order.leader_signed_at,
  }
}

function handleExportAll(order: LeaderReviewItem) {
  exportOrderResults(order.summary_all, buildWeekMeta(order))
}

function handleExportFiltered(order: LeaderReviewItem) {
  exportOrderResults(order.summary_preview, buildWeekMeta(order))
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pendingPage.value = 1
    signedPage.value = 1
    signedLoaded.value = false
    fetchData(1)
    if (activeTab.value === 'signed') {
      fetchSignedData(1)
    }
  }, 300)
}

function rotateSearchPlaceholder() {
  searchPlaceholderIndex.value = (searchPlaceholderIndex.value + 1) % searchPlaceholders.length
}

async function fetchData(page = pendingPage.value) {
  loading.value = true
  try {
    const result = await weeklyOrderService.getLeaderReview({ page, limit: PAGE_SIZE, search: searchQuery.value || undefined })
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
    const result = await weeklyOrderService.getLeaderReview({ signed: true, page, limit: PAGE_SIZE, search: searchQuery.value || undefined })
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

onMounted(() => {
  fetchData(1)
  searchPlaceholderTimer = setInterval(rotateSearchPlaceholder, 2400)
})

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  if (searchPlaceholderTimer) {
    clearInterval(searchPlaceholderTimer)
  }
})
</script>

<style scoped>
.leader-review-search {
  position: relative;
}

.leader-review-search__placeholder {
  color: rgba(0, 0, 0, 0.54);
  font-size: 14px;
  left: 44px;
  line-height: 20px;
  max-width: calc(100% - 84px);
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  right: 40px;
  text-overflow: ellipsis;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
}

:global(.body--dark) .leader-review-search__placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.rotating-placeholder-enter-active,
.rotating-placeholder-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.rotating-placeholder-enter-from {
  opacity: 0;
  transform: translateY(calc(-50% + 6px));
}

.rotating-placeholder-leave-to {
  opacity: 0;
  transform: translateY(calc(-50% - 6px));
}

@media (prefers-reduced-motion: reduce) {
  .rotating-placeholder-enter-active,
  .rotating-placeholder-leave-active {
    transition: none;
  }
}
</style>

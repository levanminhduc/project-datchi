<template>
  <q-card
    flat
    bordered
    class="settings-card q-mt-lg"
  >
    <q-expansion-item
      label="Mở khóa chỉnh sửa tuần đặt hàng"
      header-class="text-subtitle1 text-weight-medium"
      expand-icon-class="text-primary"
    >
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md items-start">
          <div class="col-12 col-md-4">
            <AppSelect
              v-model="selectedWeekId"
              label="Tuần đặt hàng"
              :options="weekOptions"
              :loading="isLoadingWeeks"
              emit-value
              map-options
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              v-model="durationMinutes"
              label="Thời hạn mở khóa"
              :options="durationOptions"
              :disable="isUnlocked"
              emit-value
              map-options
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-6 col-md-5">
            <AppInput
              v-model="reason"
              label="Lý do mở khóa"
              :disable="isUnlocked"
              outlined
              dense
            />
          </div>
        </div>

        <div
          v-if="isUnlocked"
          class="row items-center q-col-gutter-sm q-mt-md"
        >
          <div class="col-auto">
            <q-chip
              color="warning"
              text-color="white"
              icon="lock_open"
            >
              Đang mở — còn {{ remainingLabel }}
            </q-chip>
          </div>
          <div class="col-auto text-caption text-grey-7">
            Mở bởi {{ activeUnlock?.granted_by }} · {{ activeUnlock?.reason }}
          </div>
          <div class="col-12 col-md-auto q-mt-sm">
            <AppButton
              label="Khóa lại"
              color="negative"
              icon="lock"
              :loading="isSaving"
              @click="handleRevoke"
            />
          </div>
        </div>

        <div
          v-else
          class="row q-mt-md"
        >
          <AppButton
            label="Mở khóa chỉnh sửa"
            color="primary"
            icon="lock_open"
            :loading="isSaving"
            :disable="!selectedWeekId || !reason.trim()"
            @click="handleGrant"
          />
        </div>

        <div class="q-mt-md text-caption text-grey-7">
          <q-icon
            name="info"
            size="xs"
            class="q-mr-xs"
          />
          Khi tuần được mở khóa, chỉ tài khoản ROOT mới vượt được chốt chặn theo trạng thái. Hết thời hạn tuần tự khóa lại.
        </div>

        <q-separator class="q-my-lg" />

        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Nhật ký thao tác
        </div>

        <DataTable
          v-model:pagination="auditPagination"
          :rows="auditRows"
          :columns="auditColumns"
          :loading="isLoadingAudit"
          row-key="id"
          dense
          empty-title="Chưa có thao tác nào"
          empty-subtitle="Tuần này chưa ghi nhận thao tác chỉnh sửa nào"
          @request="handleAuditRequest"
        >
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.created_at) }}
            </q-td>
          </template>
          <template #body-cell-changes="props">
            <q-td :props="props">
              <span
                v-if="!describeChanges(props.row)"
                class="text-grey-6"
              >—</span>
              <span
                v-else
                class="text-caption"
              >{{ describeChanges(props.row) }}</span>
            </q-td>
          </template>
        </DataTable>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import {
  weeklyOrderUnlockService,
  type WeeklyOrderEditUnlock,
  type WeeklyOrderAuditEntry,
} from '@/services/weeklyOrderUnlockService'

const snackbar = useSnackbar()
const { confirm } = useConfirm()

const selectedWeekId = ref<number | null>(null)
const weekOptions = ref<Array<{ label: string; value: number }>>([])
const isLoadingWeeks = ref(false)

const durationMinutes = ref(30)
const durationOptions = [
  { label: '30 phút', value: 30 },
  { label: '60 phút', value: 60 },
  { label: '120 phút', value: 120 },
]
const reason = ref('')

const activeUnlock = ref<WeeklyOrderEditUnlock | null>(null)
const isSaving = ref(false)
const now = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null

const auditRows = ref<WeeklyOrderAuditEntry[]>([])
const isLoadingAudit = ref(false)
const auditPagination = ref({ page: 1, rowsPerPage: 25, rowsNumber: 0 })

const auditColumns: QTableColumn[] = [
  { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' },
  { name: 'performed_by', label: 'Người thực hiện', field: 'performed_by', align: 'left' },
  { name: 'table_name', label: 'Đối tượng', field: 'table_name', align: 'left' },
  { name: 'action', label: 'Thao tác', field: 'action', align: 'left' },
  { name: 'changes', label: 'Thay đổi', field: 'changed_fields', align: 'left' },
]

const remainingMs = computed(() => {
  if (!activeUnlock.value) return 0
  return new Date(activeUnlock.value.expires_at).getTime() - now.value
})

const isUnlocked = computed(() => remainingMs.value > 0)

const remainingLabel = computed(() => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs.value / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`
})

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN')
}

function describeChanges(row: WeeklyOrderAuditEntry) {
  if (!row.changed_fields?.length) return ''
  return row.changed_fields
    .map((field) => {
      const before = row.old_values?.[field]
      const after = row.new_values?.[field]
      return `${field}: ${JSON.stringify(before ?? null)} → ${JSON.stringify(after ?? null)}`
    })
    .join(' · ')
}

async function loadWeeks() {
  isLoadingWeeks.value = true
  try {
    const weeks = await weeklyOrderService.getAll()
    weekOptions.value = weeks.map((w) => ({
      label: `${w.week_name} (${w.status})`,
      value: w.id,
    }))
  } catch {
    snackbar.error('Không thể tải danh sách tuần đặt hàng')
  } finally {
    isLoadingWeeks.value = false
  }
}

async function loadUnlock() {
  if (!selectedWeekId.value) {
    activeUnlock.value = null
    return
  }
  try {
    const result = await weeklyOrderUnlockService.getByWeek(selectedWeekId.value)
    activeUnlock.value = result.active
  } catch {
    activeUnlock.value = null
  }
}

async function loadAudit(page = 1) {
  if (!selectedWeekId.value) {
    auditRows.value = []
    auditPagination.value = { page: 1, rowsPerPage: auditPagination.value.rowsPerPage, rowsNumber: 0 }
    return
  }
  isLoadingAudit.value = true
  try {
    const result = await weeklyOrderUnlockService.getAudit(
      selectedWeekId.value,
      page,
      auditPagination.value.rowsPerPage,
    )
    auditRows.value = result.rows
    auditPagination.value = {
      page: result.page,
      rowsPerPage: result.limit,
      rowsNumber: result.total,
    }
  } catch {
    snackbar.error('Không thể tải nhật ký thao tác')
  } finally {
    isLoadingAudit.value = false
  }
}

function handleAuditRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  auditPagination.value.rowsPerPage = props.pagination.rowsPerPage
  loadAudit(props.pagination.page)
}

async function handleGrant() {
  if (!selectedWeekId.value) return
  isSaving.value = true
  try {
    activeUnlock.value = await weeklyOrderUnlockService.grant(
      selectedWeekId.value,
      durationMinutes.value,
      reason.value.trim(),
    )
    snackbar.success(`Đã mở khóa chỉnh sửa trong ${durationMinutes.value} phút`)
    await loadAudit(1)
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể mở khóa tuần đặt hàng')
  } finally {
    isSaving.value = false
  }
}

async function handleRevoke() {
  if (!activeUnlock.value) return
  const confirmed = await confirm({
    title: 'Khóa lại tuần đặt hàng',
    message: 'Khóa lại ngay? Các thao tác chỉnh sửa sẽ bị chặn trở lại.',
    type: 'warning',
  })
  if (!confirmed) return

  isSaving.value = true
  try {
    await weeklyOrderUnlockService.revoke(activeUnlock.value.id)
    activeUnlock.value = null
    reason.value = ''
    snackbar.success('Đã khóa lại tuần đặt hàng')
    await loadAudit(1)
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể khóa lại tuần đặt hàng')
  } finally {
    isSaving.value = false
  }
}

watch(selectedWeekId, async () => {
  reason.value = ''
  await Promise.all([loadUnlock(), loadAudit(1)])
})

onMounted(() => {
  loadWeeks()
  tickTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})
</script>

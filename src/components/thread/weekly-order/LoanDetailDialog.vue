<template>
  <AppDialog
    :model-value="modelValue"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Chi tiết khoản mượn
    </template>

    <div
      v-if="loadingLoan"
      class="text-center q-pa-xl"
    >
      <q-spinner
        size="md"
        color="primary"
      />
    </div>

    <div
      v-else-if="loadError"
      class="text-center q-pa-xl"
    >
      <q-icon
        name="error_outline"
        size="48px"
        color="negative"
      />
      <div class="text-body2 text-grey-7 q-mt-sm">
        Lỗi tải lịch sử
      </div>
      <AppButton
        flat
        color="primary"
        label="Thử lại"
        icon="refresh"
        class="q-mt-sm"
        @click="loadData"
      />
    </div>

    <template v-else-if="loan">
      <!-- Loan header info -->
      <div class="bg-grey-1 rounded-borders q-pa-sm q-mb-md">
        <div class="row items-center q-mb-xs">
          <span class="text-weight-medium">{{ loan.from_week?.week_name ?? 'Tồn kho' }}</span>
          <q-icon
            name="arrow_forward"
            size="xs"
            class="q-mx-xs text-grey-6"
          />
          <span class="text-weight-medium">{{ loan.to_week?.week_name ?? '—' }}</span>
          <q-space />
          <AppBadge
            :label="loan.status === 'SETTLED' ? 'Đã hoàn tất' : 'Đang mượn'"
            :color="loan.status === 'SETTLED' ? 'positive' : 'warning'"
          />
        </div>
        <div
          v-if="loan.thread_type"
          class="text-body2 q-mb-xs"
        >
          Chỉ: <strong>{{ formatThreadTypeDisplay(loan.thread_type?.supplier?.name, loan.thread_type?.tex_number, loan.thread_type?.color?.name, loan.thread_type?.name) }}</strong>
        </div>
        <div class="text-body2 row q-gutter-sm">
          <span>Mượn: <strong>{{ loan.quantity_cones }}</strong></span>
          <span>Đã trả: <strong class="text-positive">{{ loan.returned_cones }}</strong></span>
          <span>Còn lại: <strong :class="loan.status === 'SETTLED' ? 'text-grey' : 'text-warning'">
            {{ loan.quantity_cones - loan.returned_cones }}
          </strong></span>
        </div>
      </div>

      <!-- Return history -->
      <div class="text-subtitle2 text-weight-medium q-mb-sm">
        Lịch sử trả chỉ
      </div>

      <div
        v-if="loadingLogs"
        class="text-center q-pa-md"
      >
        <q-spinner
          size="sm"
          color="primary"
        />
        <span class="q-ml-sm text-grey text-body2">Đang tải lịch sử...</span>
      </div>

      <div
        v-else-if="logError"
        class="text-center q-pa-md"
      >
        <q-icon
          name="error_outline"
          size="24px"
          color="negative"
        />
        <div class="text-body2 text-grey-7 q-mt-xs">
          Lỗi tải lịch sử
        </div>
        <AppButton
          flat
          size="sm"
          color="primary"
          label="Thử lại"
          icon="refresh"
          class="q-mt-xs"
          @click="loadLogs"
        />
      </div>

      <div
        v-else-if="logs.length === 0"
        class="text-center text-grey q-pa-md text-body2"
      >
        Chưa có lần trả nào
      </div>

      <q-list
        v-else
        dense
        separator
      >
        <q-item
          v-for="log in logs"
          :key="log.id"
          class="q-px-xs"
        >
          <q-item-section avatar>
            <q-icon
              :name="log.return_type === 'AUTO' ? 'smart_toy' : 'build'"
              :color="log.return_type === 'AUTO' ? 'info' : 'primary'"
              size="xs"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2">
              <strong>{{ log.cones_returned }} cuộn</strong>
              <AppBadge
                :label="log.return_type === 'AUTO' ? 'Tự động' : 'Thủ công'"
                :color="log.return_type === 'AUTO' ? 'info' : 'primary'"
                class="q-ml-xs"
              />
            </q-item-label>
            <q-item-label
              caption
              class="text-grey-7"
            >
              {{ log.returned_by }} · {{ formatDateTime(log.created_at) }}
              <span
                v-if="log.notes"
                class="q-ml-xs"
              >· {{ log.notes }}</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Manual return button -->
      <div
        v-if="loan.status === 'ACTIVE'"
        class="q-mt-md text-right"
      >
        <AppButton
          color="primary"
          icon="undo"
          label="Trả thủ công"
          size="sm"
          @click="showManualReturn = true"
        />
      </div>
    </template>

    <ManualReturnDialog
      v-if="loan && loan.status === 'ACTIVE'"
      v-model="showManualReturn"
      :loan="loan"
      :week-id="loan.to_week_id"
      @returned="onManualReturned"
    />
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { ThreadOrderLoan, LoanReturnLog } from '@/types/thread'
import { formatThreadTypeDisplay } from '@/utils/thread-format'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import ManualReturnDialog from './ManualReturnDialog.vue'

const props = defineProps<{
  modelValue: boolean
  loanId: number
  initialLoan?: ThreadOrderLoan
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  returned: []
}>()

const loan = ref<ThreadOrderLoan | null>(props.initialLoan ?? null)
const logs = ref<LoanReturnLog[]>([])
const loadingLoan = ref(false)
const loadingLogs = ref(false)
const loadError = ref(false)
const logError = ref(false)
const showManualReturn = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadData()
  },
  { immediate: true },
)

async function loadData() {
  loadError.value = false
  logError.value = false
  await Promise.all([loadLoan(), loadLogs()])
}

async function loadLoan() {
  if (props.initialLoan) {
    loan.value = props.initialLoan
    return
  }
  loadingLoan.value = true
  try {
    const all = await weeklyOrderService.getAllLoans()
    loan.value = all.find((l) => l.id === props.loanId) ?? null
    if (!loan.value) loadError.value = true
  } catch {
    loadError.value = true
  } finally {
    loadingLoan.value = false
  }
}

async function loadLogs() {
  loadingLogs.value = true
  logError.value = false
  try {
    logs.value = await weeklyOrderService.getReturnLogs(props.loanId)
  } catch {
    logError.value = true
  } finally {
    loadingLogs.value = false
  }
}

async function onManualReturned() {
  showManualReturn.value = false
  await loadData()
  emit('returned')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { date } from 'quasar'
import { useReturnV2, type ReturnLineInput } from '@/composables/thread/useReturnV2'
import { useSnackbar } from '@/composables'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { IssueLineV2WithComputed } from '@/types/thread/issueV2'

const snackbar = useSnackbar()
const {
  confirmedIssues,
  selectedIssue,
  returnLogs,
  isLoading,
  loadConfirmedIssues,
  loadIssueDetails,
  loadReturnLogs,
  submitReturn,
  clearSelectedIssue,
  validateReturnQuantities,
} = useReturnV2()

const selectedIssueId = ref<number | null>(null)
const returnInputs = ref<Map<number, { full: number; partial: number }>>(new Map())
const validationErrors = ref<string[]>([])

const issueOptions = computed(() => {
  return confirmedIssues.value.map((issue) => ({
    value: issue.id,
    label: `${issue.issue_code} - ${issue.department} (${formatDate(issue.created_at)})`,
  }))
})

const hasReturnInputs = computed(() => {
  for (const [, value] of returnInputs.value) {
    if (value.full > 0 || value.partial > 0) {
      return true
    }
  }
  return false
})

watch(selectedIssueId, async (newId) => {
  if (newId) {
    await loadIssueDetails(newId)
    await loadReturnLogs(newId)
    returnInputs.value = new Map()
    validationErrors.value = []
  } else {
    clearSelectedIssue()
    returnInputs.value = new Map()
    validationErrors.value = []
  }
})

onMounted(() => {
  loadConfirmedIssues()
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function getReturnInput(lineId: number): { full: number; partial: number } {
  if (!returnInputs.value.has(lineId)) {
    returnInputs.value.set(lineId, { full: 0, partial: 0 })
  }
  return returnInputs.value.get(lineId)!
}

function updateReturnFull(lineId: number, value: number | string | null, line: IssueLineV2WithComputed) {
  const input = getReturnInput(lineId)
  const totalRemaining = getTotalRemaining(line)
  const perTypeMax = line.issued_full - line.returned_full
  const numValue = Math.max(0, Math.min(Number(value) || 0, perTypeMax, totalRemaining - input.partial))
  input.full = numValue
  const newMaxPartial = totalRemaining - numValue
  if (input.partial > newMaxPartial) {
    input.partial = Math.max(0, newMaxPartial)
  }
  returnInputs.value.set(lineId, input)
  validateInputs()
}

function updateReturnPartial(lineId: number, value: number | string | null, line: IssueLineV2WithComputed) {
  const input = getReturnInput(lineId)
  const totalRemaining = getTotalRemaining(line)
  const numValue = Math.max(0, Math.min(Number(value) || 0, totalRemaining - input.full))
  input.partial = numValue
  const perTypeMax = line.issued_full - line.returned_full
  const newMaxFull = Math.min(perTypeMax, totalRemaining - numValue)
  if (input.full > newMaxFull) {
    input.full = Math.max(0, newMaxFull)
  }
  returnInputs.value.set(lineId, input)
  validateInputs()
}

function validateInputs() {
  if (!selectedIssue.value) return

  const lines: ReturnLineInput[] = []
  for (const [lineId, input] of returnInputs.value) {
    lines.push({
      line_id: lineId,
      returned_full: input.full,
      returned_partial: input.partial,
    })
  }

  const result = validateReturnQuantities(lines, selectedIssue.value.lines)
  validationErrors.value = result.errors
}

function getTotalRemaining(line: IssueLineV2WithComputed): number {
  const totalIssued = line.issued_full + line.issued_partial
  const totalReturned = line.returned_full + line.returned_partial
  return totalIssued - totalReturned
}

function getMaxReturnFull(line: IssueLineV2WithComputed): number {
  const perTypeMax = line.issued_full - line.returned_full
  const totalRemaining = getTotalRemaining(line)
  const currentPartialInput = getReturnInput(line.id).partial
  return Math.max(0, Math.min(perTypeMax, totalRemaining - currentPartialInput))
}

function getMaxReturnPartial(line: IssueLineV2WithComputed): number {
  const totalRemaining = getTotalRemaining(line)
  const currentFullInput = getReturnInput(line.id).full
  return Math.max(0, totalRemaining - currentFullInput)
}

function hasOutstandingItems(line: IssueLineV2WithComputed): boolean {
  // Total-based: has outstanding if total remaining > 0
  return getTotalRemaining(line) > 0
}

async function handleSubmit() {
  if (!selectedIssue.value || !selectedIssueId.value) return

  if (validationErrors.value.length > 0) {
    snackbar.error('Vui lòng sửa các lỗi trước khi xác nhận')
    return
  }

  const lines: ReturnLineInput[] = []
  for (const [lineId, input] of returnInputs.value) {
    if (input.full > 0 || input.partial > 0) {
      lines.push({
        line_id: lineId,
        returned_full: input.full,
        returned_partial: input.partial,
      })
    }
  }

  const success = await submitReturn(selectedIssueId.value, lines)
  if (success) {
    returnInputs.value = new Map()
    validationErrors.value = []
    await loadIssueDetails(selectedIssueId.value)
    await loadReturnLogs(selectedIssueId.value)
    await loadConfirmedIssues()
  }
}

function handleReset() {
  returnInputs.value = new Map()
  validationErrors.value = []
}
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-ma-none">
        Nhập Lại Chỉ
      </h5>
    </div>

    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <AppSelect
          v-model="selectedIssueId"
          :options="issueOptions"
          label="Chọn phiếu xuất"
          :loading="isLoading"
          clearable
          use-input
          fill-input
          hide-selected
          style="max-width: 500px"
        />
      </q-card-section>
    </q-card>

    <q-card
      v-if="selectedIssue"
      flat
      bordered
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">
          Phiếu xuất: <strong>{{ selectedIssue.issue_code }}</strong>
          <q-badge
            :color="selectedIssue.status === 'CONFIRMED' ? 'positive' : 'grey'"
            class="q-ml-sm"
          >
            {{ selectedIssue.status }}
          </q-badge>
        </div>

        <q-banner
          v-if="validationErrors.length > 0"
          class="bg-negative text-white q-mb-md"
        >
          <template #avatar>
            <q-icon name="error" />
          </template>
          <div
            v-for="(err, idx) in validationErrors"
            :key="idx"
          >
            {{ err }}
          </div>
        </q-banner>

        <q-table
          :rows="selectedIssue?.lines || []"
          :columns="[
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
            { name: 'issued', label: 'Đã xuất', field: 'issued', align: 'center' },
            { name: 'returned', label: 'Đã trả', field: 'returned', align: 'center' },
            { name: 'outstanding', label: 'Còn lại', field: 'outstanding', align: 'center' },
            { name: 'return_input', label: 'Trả thêm', field: 'return_input', align: 'center' },
          ]"
          row-key="id"
          flat
          bordered
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
        >
          <template #body-cell-thread="props">
            <q-td :props="props">
              <div>
                <strong>{{ props.row.thread_code }}</strong>
              </div>
              <div class="text-caption text-grey">
                {{ props.row.thread_name }}
              </div>
              <div
                v-if="props.row.po_number"
                class="text-caption text-grey"
              >
                {{ props.row.po_number }} / {{ props.row.style_code }} / {{ props.row.color_name }}
              </div>
            </q-td>
          </template>

          <template #body-cell-issued="props">
            <q-td :props="props">
              <div>
                <span class="text-weight-medium">{{ props.row.issued_full }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ props.row.issued_partial }}</span> le
              </div>
            </q-td>
          </template>

          <template #body-cell-returned="props">
            <q-td :props="props">
              <div>
                <span class="text-weight-medium">{{ props.row.returned_full }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ props.row.returned_partial }}</span> le
              </div>
            </q-td>
          </template>

          <template #body-cell-outstanding="props">
            <q-td :props="props">
              <div :class="{ 'text-positive': !hasOutstandingItems(props.row) }">
                <span class="text-weight-medium">{{ getMaxReturnFull(props.row) }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ getMaxReturnPartial(props.row) }}</span> le
              </div>
            </q-td>
          </template>

          <template #body-cell-return_input="props">
            <q-td :props="props">
              <div
                v-if="hasOutstandingItems(props.row)"
                class="row items-center q-gutter-sm"
              >
                <div style="width: 90px">
                  <AppInput
                    :model-value="getReturnInput(props.row.id).full"
                    type="number"
                    dense
                    :min="0"
                    :max="getMaxReturnFull(props.row)"
                    :disable="getMaxReturnFull(props.row) === 0"
                    @update:model-value="updateReturnFull(props.row.id, $event, props.row)"
                  />
                </div>
                <span class="text-caption">ng</span>
                <span class="q-mx-xs">+</span>
                <div style="width: 90px">
                  <AppInput
                    :model-value="getReturnInput(props.row.id).partial"
                    type="number"
                    dense
                    :min="0"
                    :max="getMaxReturnPartial(props.row)"
                    :disable="getMaxReturnPartial(props.row) === 0"
                    @update:model-value="updateReturnPartial(props.row.id, $event, props.row)"
                  />
                </div>
                <span class="text-caption">le</span>
              </div>
              <div
                v-else
                class="text-positive"
              >
                <q-icon name="check_circle" />
                Đã trả hết
              </div>
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center q-pa-lg text-grey">
              Phiếu xuất không có dòng nào
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <AppButton
          label="Đặt lại"
          variant="flat"
          color="grey"
          :disable="!hasReturnInputs"
          @click="handleReset"
        />
        <AppButton
          label="Xác nhận nhập lại"
          icon="assignment_return"
          color="primary"
          :loading="isLoading"
          :disable="!hasReturnInputs || validationErrors.length > 0"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>

    <q-card
      v-if="selectedIssue"
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">
          Lịch Sử Trả Kho
        </div>

        <q-table
          :rows="returnLogs"
          :columns="[
            { name: 'index', label: 'Lần', field: 'id', align: 'center' },
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
            { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' },
            { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' },
            { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' },
          ]"
          row-key="id"
          flat
          bordered
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
        >
          <template #body-cell-index="props">
            <q-td :props="props">
              {{ props.rowIndex + 1 }}
            </q-td>
          </template>

          <template #body-cell-thread="props">
            <q-td :props="props">
              <div>{{ props.row.thread_code }} - {{ props.row.thread_name }}</div>
              <div
                v-if="props.row.color_name"
                class="text-caption text-grey"
              >
                {{ props.row.color_name }}
              </div>
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ date.formatDate(props.row.created_at, 'HH:mm DD/MM/YYYY') }}
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center q-pa-lg text-grey">
              Chưa có lịch sử trả kho
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="!isLoading && !selectedIssueId"
      flat
      bordered
    >
      <q-card-section class="text-center text-grey q-pa-xl">
        <q-icon
          name="assignment_return"
          size="64px"
          class="q-mb-md"
        />
        <div>Chọn một phiếu xuất để nhập lại chỉ</div>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="isLoading && selectedIssueId"
      flat
      bordered
    >
      <q-card-section class="text-center q-pa-xl">
        <q-spinner
          color="primary"
          size="48px"
        />
        <div class="q-mt-md text-grey">
          Đang tải...
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

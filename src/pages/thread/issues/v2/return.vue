<script setup lang="ts">
/**
 * Return V2 Page
 * Nhap Lai Chi - Return Thread Cones
 *
 * UI for returning issued thread cones back to inventory.
 * Displays data from API - no calculations in frontend.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useReturnV2, type ReturnLineInput } from '@/composables/thread/useReturnV2'
import { useSnackbar } from '@/composables'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { IssueLineV2WithComputed } from '@/types/thread/issueV2'

// Composables
const snackbar = useSnackbar()
const {
  confirmedIssues,
  selectedIssue,
  isLoading,
  loadConfirmedIssues,
  loadIssueDetails,
  submitReturn,
  clearSelectedIssue,
  validateReturnQuantities,
} = useReturnV2()

// Local state
const selectedIssueId = ref<number | null>(null)
const returnInputs = ref<Map<number, { full: number; partial: number }>>(new Map())
const validationErrors = ref<string[]>([])

// Computed
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

// Watch for issue selection change
watch(selectedIssueId, async (newId) => {
  if (newId) {
    await loadIssueDetails(newId)
    // Reset inputs when issue changes
    returnInputs.value = new Map()
    validationErrors.value = []
  } else {
    clearSelectedIssue()
    returnInputs.value = new Map()
    validationErrors.value = []
  }
})

// Lifecycle
onMounted(() => {
  loadConfirmedIssues()
})

// Methods
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function getReturnInput(lineId: number): { full: number; partial: number } {
  if (!returnInputs.value.has(lineId)) {
    returnInputs.value.set(lineId, { full: 0, partial: 0 })
  }
  return returnInputs.value.get(lineId)!
}

function updateReturnFull(lineId: number, value: number | string | null) {
  const input = getReturnInput(lineId)
  input.full = Number(value) || 0
  returnInputs.value.set(lineId, input)
  validateInputs()
}

function updateReturnPartial(lineId: number, value: number | string | null) {
  const input = getReturnInput(lineId)
  input.partial = Number(value) || 0
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

function getMaxReturnFull(line: IssueLineV2WithComputed): number {
  return line.issued_full - line.returned_full
}

function getMaxReturnPartial(line: IssueLineV2WithComputed): number {
  return line.issued_partial - line.returned_partial
}

function hasOutstandingItems(line: IssueLineV2WithComputed): boolean {
  return getMaxReturnFull(line) > 0 || getMaxReturnPartial(line) > 0
}

async function handleSubmit() {
  if (!selectedIssue.value || !selectedIssueId.value) return

  if (validationErrors.value.length > 0) {
    snackbar.error('Vui long sua cac loi truoc khi xac nhan')
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
    // Reset inputs after successful submit
    returnInputs.value = new Map()
    validationErrors.value = []
    // Reload issue details to show updated values
    await loadIssueDetails(selectedIssueId.value)
    // Reload confirmed issues in case status changed
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

    <!-- Issue Selection -->
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
          style="max-width: 500px"
        />
      </q-card-section>
    </q-card>

    <!-- Issue Lines Table -->
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

        <!-- Validation Errors -->
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

        <!-- Lines Table -->
        <q-table
          :rows="selectedIssue.lines"
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
          <!-- Thread Name Column -->
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

          <!-- Issued Column -->
          <template #body-cell-issued="props">
            <q-td :props="props">
              <div>
                <span class="text-weight-medium">{{ props.row.issued_full }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ props.row.issued_partial }}</span> le
              </div>
            </q-td>
          </template>

          <!-- Returned Column -->
          <template #body-cell-returned="props">
            <q-td :props="props">
              <div>
                <span class="text-weight-medium">{{ props.row.returned_full }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ props.row.returned_partial }}</span> le
              </div>
            </q-td>
          </template>

          <!-- Outstanding Column -->
          <template #body-cell-outstanding="props">
            <q-td :props="props">
              <div :class="{ 'text-positive': !hasOutstandingItems(props.row) }">
                <span class="text-weight-medium">{{ getMaxReturnFull(props.row) }}</span> ng
                <span class="q-mx-xs">+</span>
                <span class="text-weight-medium">{{ getMaxReturnPartial(props.row) }}</span> le
              </div>
            </q-td>
          </template>

          <!-- Return Input Column -->
          <template #body-cell-return_input="props">
            <q-td :props="props">
              <div
                v-if="hasOutstandingItems(props.row)"
                class="row items-center q-gutter-sm"
              >
                <AppInput
                  :model-value="getReturnInput(props.row.id).full"
                  type="number"
                  dense
                  style="width: 70px"
                  :disable="getMaxReturnFull(props.row) === 0"
                  :rules="[
                    (v: any) => v >= 0 || 'Phải >= 0',
                    (v: any) => v <= getMaxReturnFull(props.row) || `Tối đa ${getMaxReturnFull(props.row)}`
                  ]"
                  @update:model-value="updateReturnFull(props.row.id, $event)"
                />
                <span class="text-caption">ng</span>
                <span class="q-mx-xs">+</span>
                <AppInput
                  :model-value="getReturnInput(props.row.id).partial"
                  type="number"
                  dense
                  style="width: 70px"
                  :disable="getMaxReturnPartial(props.row) === 0"
                  :rules="[
                    (v: any) => v >= 0 || 'Phải >= 0',
                    (v: any) => v <= getMaxReturnPartial(props.row) || `Tối đa ${getMaxReturnPartial(props.row)}`
                  ]"
                  @update:model-value="updateReturnPartial(props.row.id, $event)"
                />
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

          <!-- No Data -->
          <template #no-data>
            <div class="text-center q-pa-lg text-grey">
              Phiếu xuất không có dòng nào
            </div>
          </template>
        </q-table>
      </q-card-section>

      <!-- Action Buttons -->
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

    <!-- Empty State -->
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

    <!-- Loading State -->
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
          Dang tai...
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
/* Custom styles for the return page */
</style>

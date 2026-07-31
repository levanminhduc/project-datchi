<script setup lang="ts">
import { ref } from 'vue'
import type { GroupedReturnLog } from '@/types/thread/issueV2'
import DataTable from '@/components/ui/tables/DataTable.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import IconButton from '@/components/ui/buttons/IconButton.vue'
import type { QTableColumn } from 'quasar'
import { issueV2Service } from '@/services/issueV2Service'
import { useSnackbar } from '@/composables/useSnackbar'
import { getErrorMessage } from '@/utils/errorMessages'

defineProps<{
  modelValue: boolean
  logs: GroupedReturnLog[]
  loading?: boolean
  groupLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reverted: []
}>()

const snackbar = useSnackbar()

const revertTarget = ref<GroupedReturnLog | null>(null)
const revertReason = ref('')
const isReverting = ref(false)

const columns: QTableColumn[] = [
  { name: 'created_at', label: 'Ngày trả', field: 'created_at', align: 'left', sortable: true },
  { name: 'thread_name', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
  { name: 'issue_code', label: 'Mã phiếu', field: 'issue_code', align: 'left' },
  { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' },
  { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' },
  { name: 'created_by', label: 'Người trả', field: 'created_by', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'center' },
]

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}

function revertBlockedReason(log: GroupedReturnLog): string {
  if (log.returned_partial > 0) {
    return 'Lần trả này có tách cuộn lẻ nên không hoàn tác tự động được'
  }
  return 'Không truy được cuộn của lần trả này (dữ liệu trước khi có tính năng hoàn tác)'
}

function openRevert(log: GroupedReturnLog) {
  revertTarget.value = log
  revertReason.value = ''
}

async function confirmRevert() {
  if (!revertTarget.value || !revertReason.value.trim()) return
  isReverting.value = true
  try {
    await issueV2Service.revertReturnLog(revertTarget.value.id, revertReason.value.trim())
    snackbar.success('Đã hoàn tác lần trả kho')
    revertTarget.value = null
    emit('reverted')
    emit('update:modelValue', false)
  } catch (err) {
    snackbar.error(getErrorMessage(err, 'Không thể hoàn tác lần trả'))
  } finally {
    isReverting.value = false
  }
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Lịch sử trả kho
        </div>
        <div
          v-if="groupLabel"
          class="text-subtitle2 text-grey-7 q-ml-md"
        >
          {{ groupLabel }}
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
        <div
          v-if="loading"
          class="row justify-center q-py-xl"
        >
          <q-spinner-dots
            size="40px"
            color="primary"
          />
        </div>

        <DataTable
          v-else
          :rows="logs"
          :columns="columns"
          row-key="id"
          empty-icon="history"
          empty-title="Chưa có lịch sử trả kho"
          empty-subtitle="Nhóm này chưa có lần trả nào"
        >
          <template #body-cell-created_at="{ row }">
            <q-td>
              {{ formatDateTime(row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-thread_name="{ row }">
            <q-td>
              <div class="text-weight-medium">
                {{ row.thread_code }}
              </div>
              <div
                v-if="row.thread_name"
                class="text-caption text-grey-7"
              >
                {{ row.thread_name }}
              </div>
            </q-td>
          </template>

          <template #body-cell-returned_full="{ row }">
            <q-td class="text-center">
              {{ row.returned_full || '-' }}
            </q-td>
          </template>

          <template #body-cell-returned_partial="{ row }">
            <q-td class="text-center">
              {{ row.returned_partial || '-' }}
            </q-td>
          </template>

          <template #body-cell-created_by="{ row }">
            <q-td>
              {{ row.created_by || '-' }}
            </q-td>
          </template>

          <template #body-cell-actions="{ row }">
            <q-td class="text-center">
              <q-chip
                v-if="row.reverted_at"
                dense
                square
                color="grey-4"
                text-color="grey-8"
                :label="`Đã hoàn tác${row.reverted_by ? ' — ' + row.reverted_by : ''}`"
              />
              <IconButton
                v-else-if="row.can_revert"
                icon="undo"
                color="negative"
                tooltip="Hoàn tác lần trả này"
                @click="openRevert(row)"
              />
              <IconButton
                v-else
                icon="undo"
                color="grey-5"
                disable
                :tooltip="revertBlockedReason(row)"
              />
            </q-td>
          </template>
        </DataTable>
      </q-card-section>
    </q-card>

    <q-dialog
      :model-value="revertTarget !== null"
      @update:model-value="revertTarget = null"
    >
      <q-card style="min-width: 460px">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            Hoàn tác lần trả kho
          </div>
          <div
            v-if="revertTarget"
            class="text-caption text-grey-7"
          >
            {{ revertTarget.thread_code }} — {{ revertTarget.returned_full }} cuộn nguyên, trả ngày
            {{ formatDateTime(revertTarget.created_at) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-banner
            dense
            class="bg-orange-1 text-orange-9 q-mb-md"
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Số cuộn này sẽ quay lại trạng thái đang xuất cho sản xuất và bị trừ khỏi tồn kho.
          </q-banner>

          <AppInput
            v-model="revertReason"
            label="Lý do hoàn tác"
            type="textarea"
            rows="2"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <AppButton
            flat
            label="Đóng"
            @click="revertTarget = null"
          />
          <AppButton
            color="negative"
            label="Xác nhận hoàn tác"
            :loading="isReverting"
            :disable="!revertReason.trim() || isReverting"
            @click="confirmRevert"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

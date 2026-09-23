<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ReturnGroup } from '@/types/thread/issueV2'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import ReturnGroupCard from '@/components/thread/ReturnGroupCard.vue'
import ReturnGroupDetail from '@/components/thread/ReturnGroupDetail.vue'
import { useReturnV2 } from '@/composables/thread/useReturnV2'
import { useConfirm } from '@/composables/useConfirm'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.issues.return'],
  },
})

const snackbar = useSnackbar()

const {
  returnGroups,
  selectedGroup,
  returnLogs,
  isLoading: isGroupLoading,
  loadReturnGroups,
  selectGroup,
  submitGroupedReturn,
  validateReturnQuantities,
} = useReturnV2()

const { confirmWarning } = useConfirm()

const groupSearch = ref('')

const filteredReturnGroups = computed(() => {
  const q = groupSearch.value.trim().toLowerCase()
  if (!q) return returnGroups.value
  return returnGroups.value.filter(
    (g) =>
      g.po_number.toLowerCase().includes(q) ||
      g.style_code.toLowerCase().includes(q) ||
      g.color_name.toLowerCase().includes(q),
  )
})

async function handleSelectGroup(group: ReturnGroup) {
  selectGroup(group)
}

function handleCancelGroup() {
  selectGroup(null)
}

async function handleGroupReturn(payload: {
  warehouseId: number | null
  lines: { thread_type_id: number; thread_color_id: number | null; returned_full: number; returned_partial: number }[]
}) {
  if (!selectedGroup.value) return
  const { valid, errors } = validateReturnQuantities(payload.lines, selectedGroup.value.threads)
  if (!valid) {
    snackbar.error(errors[0] ?? 'Số lượng trả không hợp lệ')
    return
  }
  const confirmed = await confirmWarning(
    `Trả kho cho nhóm ${selectedGroup.value.po_number} / ${selectedGroup.value.style_code} / ${selectedGroup.value.color_name}?`,
    'Xác nhận trả kho'
  )
  if (!confirmed) return
  await submitGroupedReturn(selectedGroup.value, payload.lines, payload.warehouseId)
}

onMounted(() => {
  selectGroup(null)
  loadReturnGroups()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Trả Kho"
      subtitle="Chọn nhóm đơn hàng để trả chỉ về kho"
    />

    <ReturnGroupDetail
      v-if="selectedGroup"
      :group="selectedGroup"
      :loading="isGroupLoading"
      :return-logs="returnLogs"
      :logs-loading="isGroupLoading"
      @submit="handleGroupReturn"
      @cancel="handleCancelGroup"
      @reverted="loadReturnGroups"
    />

    <q-card
      v-else
      flat
      bordered
    >
      <q-card-section>
        <div
          v-if="isGroupLoading"
          class="row justify-center q-py-xl"
        >
          <q-spinner-dots
            size="50px"
            color="primary"
          />
        </div>

        <div
          v-else-if="returnGroups.length === 0"
          class="text-center q-py-xl"
        >
          <q-icon
            name="check_circle"
            size="64px"
            color="positive"
          />
          <div class="text-h6 q-mt-md text-grey-7">
            Không có nhóm nào cần trả
          </div>
          <div class="text-body2 text-grey-6">
            Các phiếu xuất đã trả đủ, hoặc tuần đặt hàng đã được đánh dấu hoàn tất
          </div>
        </div>

        <template v-else>
          <div class="row q-mb-md">
            <div class="col-12 col-sm-6 col-md-4">
              <AppInput
                v-model="groupSearch"
                label="Tìm kiếm theo PO/Mã hàng/Màu hàng"
                dense
                clearable
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="filter_list" />
                </template>
              </AppInput>
            </div>
          </div>

          <div
            v-if="filteredReturnGroups.length === 0"
            class="text-center q-py-lg text-grey-6"
          >
            Không tìm thấy nhóm phù hợp
          </div>

          <ReturnGroupCard
            v-for="group in filteredReturnGroups"
            :key="group.group_key"
            :group="group"
            @select="handleSelectGroup"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

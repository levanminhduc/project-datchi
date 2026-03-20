<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Kết quả nhập kho
    </template>

    <div class="q-gutter-md">
      <q-banner
        class="bg-positive text-white rounded-borders"
        dense
      >
        <template #avatar>
          <q-icon
            name="check_circle"
            size="sm"
          />
        </template>
        Đã nhập {{ result.cones_created }} cuộn vào kho
      </q-banner>

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <div class="text-caption text-grey-6">
            Số cuộn tạo
          </div>
          <div class="text-body2 text-weight-medium">
            {{ result.cones_created }} cuộn
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey-6">
            Số lô
          </div>
          <div class="text-body2 text-weight-medium">
            {{ result.lot_number || '-' }}
          </div>
        </div>
        <div
          v-if="result.cones_reserved > 0"
          class="col-6"
        >
          <div class="text-caption text-grey-6">
            Đã reserve cho tuần này
          </div>
          <div class="text-body2 text-positive text-weight-medium">
            {{ result.cones_reserved }} cuộn
          </div>
        </div>
        <div
          v-if="result.remaining_shortage > 0"
          class="col-6"
        >
          <div class="text-caption text-grey-6">
            Còn thiếu
          </div>
          <div class="text-body2 text-negative text-weight-medium">
            {{ result.remaining_shortage }} cuộn
          </div>
        </div>
      </div>

      <q-separator v-if="hasAutoReturn" />

      <div v-if="hasAutoReturn">
        <div class="text-subtitle2 text-weight-medium q-mb-sm">
          <q-icon
            name="swap_horiz"
            color="info"
            class="q-mr-xs"
          />
          Đã tự động trả chỉ mượn
        </div>
        <div class="text-body2 text-grey-7 q-mb-sm">
          Trả {{ result.auto_return.returned_cones }} cuộn
          <span v-if="result.auto_return.settled > 0">
            · {{ result.auto_return.settled }} khoản mượn đã thanh toán
          </span>
        </div>
        <q-list
          dense
          separator
          bordered
          class="rounded-borders"
        >
          <q-item
            v-for="detail in result.auto_return.details"
            :key="detail.loan_id"
          >
            <q-item-section>
              <q-item-label>
                {{ detail.from_week_name }}
              </q-item-label>
              <q-item-label caption>
                {{ detail.cones_returned }} cuộn
                <q-badge
                  v-if="detail.fully_settled"
                  color="positive"
                  label="Đã thanh toán"
                  class="q-ml-sm"
                />
                <q-badge
                  v-else
                  color="warning"
                  label="Trả một phần"
                  class="q-ml-sm"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <template #actions>
      <AppButton
        v-close-popup
        variant="flat"
        label="Đóng"
        color="primary"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import type { AutoReturnDetail } from '@/services/deliveryService'

export interface ReceiveResult {
  cones_created: number
  cones_reserved: number
  remaining_shortage: number
  lot_number: string
  auto_return: {
    settled: number
    returned_cones: number
    details: AutoReturnDetail[]
  }
}

const props = defineProps<{
  modelValue: boolean
  result: ReceiveResult
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const hasAutoReturn = computed(() => {
  return props.result.auto_return.returned_cones > 0
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 440px">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">
          Hoàn tác lần nhập kho
        </div>
      </q-card-section>

      <q-card-section v-if="log">
        <q-banner
          dense
          class="bg-orange-1 text-orange-9 q-mb-md"
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          Toàn bộ {{ log.quantity }} cuộn của lần nhập này sẽ chuyển sang trạng thái Loại bỏ.
          Nếu có cuộn đã xuất hoặc đã chuyển đi thì hệ thống sẽ chặn.
        </q-banner>

        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <div class="text-caption text-grey-7">
              Tuần
            </div>
            <div>{{ log.week_name || '—' }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">
              Kho nhập
            </div>
            <div>{{ log.warehouse_name || '—' }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">
              Loại chỉ
            </div>
            <div>{{ log.thread_type_name || '—' }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-7">
              Số lượng đã nhập
            </div>
            <div class="text-weight-medium">
              {{ log.quantity }} cuộn
            </div>
          </div>
        </div>

        <AppInput
          v-model="reason"
          label="Lý do hoàn tác"
          type="textarea"
          rows="2"
          outlined
          dense
          autofocus
        />
      </q-card-section>

      <q-card-actions align="right">
        <AppButton
          flat
          label="Đóng"
          @click="emit('update:modelValue', false)"
        />
        <AppButton
          color="negative"
          label="Hoàn tác"
          :loading="isSubmitting"
          :disable="!reason.trim()"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { weeklyOrderStockAdjustService } from '@/services/weeklyOrderStockAdjustService'
import type { DeliveryReceiveLog } from '@/types/thread'

const props = defineProps<{
  modelValue: boolean
  log: DeliveryReceiveLog | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reverted: []
}>()

const snackbar = useSnackbar()

const reason = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  if (!props.log || !reason.value.trim()) return

  isSubmitting.value = true
  try {
    const result = await weeklyOrderStockAdjustService.revertReceive(props.log.id, reason.value.trim())
    snackbar.success(`Đã hoàn tác ${result.reverted_quantity} cuộn của lần nhập này`)
    emit('reverted')
    emit('update:modelValue', false)
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể hoàn tác lần nhập kho')
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = ''
  },
)
</script>

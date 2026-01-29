<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'
import type { Recovery } from '@/types/thread'

interface Props {
  modelValue: boolean
  recovery: Recovery | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recovery: null,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: { supervisorNotes: string }]
}>()

const supervisorNotes = ref('')
const isApproved = ref(false)

const threadType = computed(() => props.recovery?.cone?.thread_type)
const remainingWeight = computed(() => props.recovery?.returned_weight_grams || 0)
const remainingMeters = computed(() => props.recovery?.remaining_meters || 0)

const isTooHeavy = computed(() => remainingWeight.value > 50)

watch(() => props.modelValue, (val) => {
  if (val) {
    supervisorNotes.value = ''
    isApproved.value = false
  }
})

const onSubmit = () => {
  if (!isApproved.value) return
  emit('confirm', {
    supervisorNotes: supervisorNotes.value
  })
}

const onCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Phê duyệt hủy cuộn chỉ (Write-off)"
    :loading="loading"
    max-width="500px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div v-if="recovery" class="column q-gutter-md">
      <q-banner dense class="bg-red-1 text-red-9 rounded-borders">
        <template #avatar>
          <q-icon name="delete_forever" color="red-9" />
        </template>
        Thao tác này sẽ loại bỏ cuộn chỉ khỏi kho hệ thống. 
        Thường áp dụng cho các cuộn có lượng chỉ còn lại quá ít (dưới 50g).
      </q-banner>

      <q-card flat bordered>
        <q-card-section class="q-py-sm">
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">Mã cuộn:</div>
            <div class="text-weight-bold">{{ recovery.cone?.cone_id }}</div>
          </div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">Loại chỉ:</div>
            <div class="text-subtitle2 text-primary">{{ threadType?.name || 'N/A' }}</div>
          </div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">Trọng lượng còn lại:</div>
            <div class="text-weight-bold text-negative">{{ remainingWeight }} g</div>
          </div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">Độ dài tương ứng:</div>
            <div class="text-weight-medium">{{ remainingMeters.toLocaleString() }} m</div>
          </div>
        </q-card-section>
      </q-card>

      <div v-if="isTooHeavy" class="q-pa-sm rounded-borders bg-amber-1 text-amber-9 text-caption">
        <q-icon name="warning" class="q-mr-xs" />
        Lưu ý: Cuộn chỉ này nặng hơn 50g. Hãy chắc chắn rằng nó thực sự cần hủy.
      </div>

      <AppInput
        v-model="supervisorNotes"
        label="Lý do hủy & Ghi chú phê duyệt"
        required
        autogrow
        placeholder="Nhập lý do tại sao cuộn chỉ này bị hủy..."
      />

      <AppCheckbox
        v-model="isApproved"
        label="Tôi xác nhận phê duyệt hủy cuộn chỉ này"
        color="negative"
        required
      />
    </div>
  </FormDialog>
</template>

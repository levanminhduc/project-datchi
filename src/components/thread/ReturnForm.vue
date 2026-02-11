<script setup lang="ts">
/**
 * ReturnForm - Form for returning partial cones
 * Xuất kho sản xuất - Issue to Production
 *
 * Allows selecting percentage of thread remaining for return
 */
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import PercentageSelector from './PercentageSelector.vue'
import type { CreateIssueReturnDTO } from '@/types/thread/issue'

interface Props {
  issueItemId: number
  coneId: number
  coneCode: string
  originalMeters: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'submit': [data: CreateIssueReturnDTO]
  'cancel': []
}>()

// Form state
const percentage = ref(100)
const notes = ref('')

// Calculate remaining meters based on percentage
const calculatedMeters = computed(() => {
  return (props.originalMeters * percentage.value) / 100
})

// Validation
const isValid = computed(() => {
  return percentage.value > 0 && percentage.value <= 100
})

// Submit handler
function handleSubmit() {
  if (!isValid.value) return

  emit('submit', {
    issue_item_id: props.issueItemId,
    cone_id: props.coneId,
    remaining_percentage: percentage.value,
    notes: notes.value || undefined,
  })
}

// Cancel handler
function handleCancel() {
  emit('cancel')
}

// Reset form
function resetForm() {
  percentage.value = 100
  notes.value = ''
}

// Expose reset method
defineExpose({ resetForm })
</script>

<template>
  <q-card
    flat
    bordered
    class="return-form"
  >
    <q-card-section>
      <div class="text-h6">
        Nhập Lại Cuộn
      </div>
      <div class="text-caption text-grey-7">
        Hoàn trả cuộn chỉ còn lại sau sản xuất
      </div>
    </q-card-section>

    <q-card-section>
      <div class="column q-gutter-md">
        <!-- Cone Info -->
        <q-card
          flat
          bordered
          class="bg-grey-1"
        >
          <q-card-section>
            <div class="row items-center q-gutter-md">
              <q-icon
                name="inventory_2"
                size="32px"
                color="primary"
              />
              <div class="col">
                <div class="text-subtitle2">
                  Thông Tin Cuộn
                </div>
                <div class="text-body2">
                  Mã cuộn: <strong>{{ coneCode }}</strong>
                </div>
                <div class="text-body2">
                  Mét ban đầu: <strong>{{ originalMeters.toLocaleString('vi-VN') }} m</strong>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Percentage Selector -->
        <div>
          <PercentageSelector
            v-model="percentage"
            :original-meters="originalMeters"
          />
        </div>

        <!-- Calculated Result -->
        <q-card
          flat
          bordered
          class="bg-blue-1"
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">
                  Số Mét Nhập Lại
                </div>
                <div class="text-h5 text-primary">
                  {{ calculatedMeters.toLocaleString('vi-VN') }} m
                </div>
              </div>
              <q-badge
                :color="percentage === 100 ? 'positive' : 'warning'"
                :label="percentage === 100 ? 'Nguyên cuộn' : 'Cuộn lẻ'"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Notes -->
        <AppTextarea
          v-model="notes"
          label="Ghi Chú (Tùy Chọn)"
          placeholder="Nhập ghi chú về tình trạng cuộn chỉ..."
          rows="2"
        />
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <AppButton
        label="Hủy"
        variant="flat"
        color="grey"
        @click="handleCancel"
      />
      <AppButton
        label="Xác Nhận Nhập"
        color="primary"
        :loading="loading"
        :disable="!isValid"
        @click="handleSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.return-form {
  max-width: 500px;
}
</style>

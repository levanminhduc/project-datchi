<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AllocationConflict, Allocation, ConflictResolution } from '@/types/thread'
import { AllocationPriority } from '@/types/thread/enums'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import AppSlider from '@/components/ui/inputs/AppSlider.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'

interface Props {
  conflict: AllocationConflict
  selectedAllocation?: Allocation
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'resolve', resolution: ConflictResolution): void
  (e: 'cancel'): void
}>()

const priorityOptions = [
  { label: 'Thấp', value: AllocationPriority.LOW },
  { label: 'Bình thường', value: AllocationPriority.NORMAL },
  { label: 'Cao', value: AllocationPriority.HIGH },
  { label: 'Khẩn cấp', value: AllocationPriority.URGENT },
]

// Form state
const resolutionAction = ref<'ADJUST_PRIORITY' | 'CANCEL' | 'SPLIT' | 'ESCALATE'>('ADJUST_PRIORITY')
const newPriority = ref<AllocationPriority>(props.selectedAllocation?.priority || AllocationPriority.NORMAL)
const splitMeters = ref<number>(0)
const notes = ref('')

const isAllocationSelected = computed(() => !!props.selectedAllocation)

const shortagePercent = computed(() => {
  if (props.conflict.total_requested === 0) return 0
  return Math.round((props.conflict.shortage / props.conflict.total_requested) * 100)
})

const formatMeters = (m: number) => `${m.toLocaleString()} m`

const handleResolve = () => {
  const resolution: ConflictResolution = {
    action: resolutionAction.value,
    allocation_id: props.selectedAllocation?.id,
    notes: notes.value,
    ...(resolutionAction.value === 'ADJUST_PRIORITY' && { new_priority: newPriority.value }),
    ...(resolutionAction.value === 'SPLIT' && { split_meters: splitMeters.value })
  }
  
  emit('resolve', resolution)
}
</script>

<template>
  <div class="conflict-resolution-panel rounded-borders shadow-1 overflow-hidden">
    <!-- Header Summary -->
    <div class="bg-primary text-white q-pa-md">
      <div class="row items-center justify-between">
        <div class="text-h6">Giải quyết xung đột</div>
        <q-chip color="white" text-color="primary" dense class="text-weight-bold">
          {{ conflict.thread_type?.code || 'Chỉ' }}
        </q-chip>
      </div>
      
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-4 text-center">
          <div class="text-caption opacity-80">Tổng nhu cầu</div>
          <div class="text-subtitle1 text-weight-bold">{{ formatMeters(conflict.total_requested) }}</div>
        </div>
        <div class="col-4 text-center border-left-white">
          <div class="text-caption opacity-80">Hiện có</div>
          <div class="text-subtitle1 text-weight-bold text-light-green-11">{{ formatMeters(conflict.total_available) }}</div>
        </div>
        <div class="col-4 text-center border-left-white">
          <div class="text-caption opacity-80">Thiếu hụt</div>
          <div class="text-subtitle1 text-weight-bold text-orange-11">
            {{ formatMeters(conflict.shortage) }}
            <span class="text-caption">({{ shortagePercent }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Reminder -->
    <div v-if="!isAllocationSelected" class="q-pa-xl flex flex-center text-grey-7 text-center">
      <div>
        <q-icon name="touch_app" size="3rem" color="grey-4" class="q-mb-md" />
        <div class="text-subtitle1">Chọn một lệnh sản xuất từ dòng thời gian</div>
        <div class="text-caption">để thực hiện các hành động giải quyết</div>
      </div>
    </div>

    <!-- Resolution Options -->
    <div v-else class="q-pa-md">
      <div class="text-subtitle2 q-mb-md flex items-center">
        <q-icon name="settings" class="q-mr-xs" color="primary" />
        Xử lý LSX: <span class="text-primary q-ml-xs">{{ selectedAllocation?.order_id }}</span>
      </div>

      <div class="q-gutter-y-md">
        <!-- Action Selection -->
        <q-btn-toggle
          v-model="resolutionAction"
          spread
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          :options="[
            { label: 'Ưu tiên', value: 'ADJUST_PRIORITY', icon: 'trending_up' },
            { label: 'Chia nhỏ', value: 'SPLIT', icon: 'call_split' },
            { label: 'Hủy', value: 'CANCEL', icon: 'block' },
            { label: 'Báo cáo', value: 'ESCALATE', icon: 'report_problem' }
          ]"
        />

        <!-- Dynamic Inputs based on Action -->
        <q-card flat bordered class="bg-grey-1">
          <q-card-section>
            <!-- Adjust Priority -->
            <div v-if="resolutionAction === 'ADJUST_PRIORITY'" class="q-gutter-y-sm">
              <div class="text-caption text-grey-7">Điều chỉnh mức độ ưu tiên</div>
              <AppSelect
                v-model="newPriority"
                :options="priorityOptions"
                label="Mức ưu tiên mới"
                emit-value
                map-options
                dense
                outlined
              />
              <div class="text-caption text-blue-9 bg-blue-1 q-pa-sm rounded-borders">
                <q-icon name="info" class="q-mr-xs" />
                LSX sẽ được sắp xếp lại trong danh sách chờ dựa trên điểm số ưu tiên mới.
              </div>
            </div>

            <!-- Split Allocation -->
            <div v-if="resolutionAction === 'SPLIT'" class="q-gutter-y-sm">
              <div class="text-caption text-grey-7">Số lượng cấp trước (m)</div>
              <q-input
                v-model.number="splitMeters"
                type="number"
                label="Số lượng cấp"
                suffix="m"
                dense
                outlined
                :rules="[val => val > 0 && val < (selectedAllocation?.requested_meters || 0) || 'Số lượng phải lớn hơn 0 và nhỏ hơn yêu cầu ban đầu']"
              />
              <div class="text-caption text-amber-9 bg-amber-1 q-pa-sm rounded-borders">
                <q-icon name="info" class="q-mr-xs" />
                Phần còn lại sẽ được chuyển vào danh sách chờ.
              </div>
            </div>

            <!-- Cancel -->
            <div v-if="resolutionAction === 'CANCEL'" class="flex flex-center q-pa-sm">
              <div class="text-center">
                <q-icon name="warning" color="negative" size="md" />
                <div class="text-subtitle2 text-negative">Xác nhận hủy yêu cầu</div>
                <div class="text-caption">Yêu cầu phân bổ cho LSX này sẽ bị loại bỏ khỏi danh sách.</div>
              </div>
            </div>

            <!-- Escalate -->
            <div v-if="resolutionAction === 'ESCALATE'" class="flex flex-center q-pa-sm">
              <div class="text-center">
                <q-icon name="assignment_late" color="orange" size="md" />
                <div class="text-subtitle2 text-orange-9">Báo cáo lên cấp trên</div>
                <div class="text-caption">Gửi thông báo cho quản lý kho/sản xuất để xin ý kiến chỉ đạo.</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Resolution Notes -->
        <AppTextarea
          v-model="notes"
          label="Ghi chú giải quyết"
          placeholder="Lý do điều chỉnh hoặc hướng dẫn thêm..."
          rows="3"
        />

        <!-- Action Buttons -->
        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col-6">
            <q-btn
              label="Hủy bỏ"
              color="grey"
              flat
              class="full-width"
              @click="emit('cancel')"
            />
          </div>
          <div class="col-6">
            <AppButton
              label="Xác nhận"
              color="primary"
              class="full-width"
              @click="handleResolve"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opacity-80 {
  opacity: 0.8;
}

.border-left-white {
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.rounded-borders {
  border-radius: 8px;
}
</style>

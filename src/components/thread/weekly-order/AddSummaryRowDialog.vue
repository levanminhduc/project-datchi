<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">
          Thêm dòng chỉ vào tuần
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <AppSelect
          v-model="threadTypeId"
          label="Loại chỉ"
          :options="threadTypeOptions"
          :loading="isLoading"
          use-input
          emit-value
          map-options
          outlined
          dense
          @filter="filterThreadTypes"
        />
        <AppSelect
          v-model="colorId"
          label="Màu chỉ"
          :options="colorOptions"
          :loading="isLoading"
          use-input
          clearable
          emit-value
          map-options
          outlined
          dense
          @filter="filterColors"
        />
        <AppInput
          v-model.number="cones"
          label="Số cuộn"
          type="number"
          min="1"
          outlined
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <AppButton
          flat
          label="Hủy"
          @click="emit('update:modelValue', false)"
        />
        <AppButton
          color="primary"
          label="Thêm dòng"
          :disable="!canSubmit"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { threadService } from '@/services/threadService'
import { colorService } from '@/services/colorService'
import type { ThreadType, Color, AggregatedRow } from '@/types/thread'

const props = defineProps<{
  modelValue: boolean
  existingKeys: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [row: AggregatedRow]
}>()

const snackbar = useSnackbar()

const threadTypes = ref<ThreadType[]>([])
const colors = ref<Color[]>([])
const isLoading = ref(false)
const hasLoaded = ref(false)

const threadTypeId = ref<number | null>(null)
const colorId = ref<number | null>(null)
const cones = ref<number>(1)

const threadTypeFilter = ref('')
const colorFilter = ref('')

const threadTypeOptions = computed(() => {
  const q = threadTypeFilter.value.toLowerCase()
  return threadTypes.value
    .filter((t) => !q || t.name.toLowerCase().includes(q) || (t.code ?? '').toLowerCase().includes(q))
    .slice(0, 100)
    .map((t) => ({ label: t.name, value: t.id }))
})

const colorOptions = computed(() => {
  const q = colorFilter.value.toLowerCase()
  return colors.value
    .filter((color) => !q || color.name.toLowerCase().includes(q))
    .slice(0, 100)
    .map((color) => ({ label: color.name, value: color.id }))
})

const canSubmit = computed(() => threadTypeId.value != null && cones.value >= 1)

function filterThreadTypes(value: string, update: (fn: () => void) => void) {
  update(() => {
    threadTypeFilter.value = value
  })
}

function filterColors(value: string, update: (fn: () => void) => void) {
  update(() => {
    colorFilter.value = value
  })
}

async function loadOptions() {
  if (hasLoaded.value) return
  isLoading.value = true
  try {
    const [types, colorList] = await Promise.all([
      threadService.getAll(),
      colorService.getAll(),
    ])
    threadTypes.value = types
    colors.value = colorList
    hasLoaded.value = true
  } catch {
    snackbar.error('Không thể tải danh sách loại chỉ và màu')
  } finally {
    isLoading.value = false
  }
}

function handleSubmit() {
  const threadType = threadTypes.value.find((t) => t.id === threadTypeId.value)
  if (!threadType) return

  const color = colors.value.find((item) => item.id === colorId.value) ?? null
  const key = `${threadType.id}_${color?.id ?? ''}`

  if (props.existingKeys.includes(key)) {
    snackbar.error('Dòng chỉ này đã có trong tuần')
    return
  }

  const metersPerCone = threadType.meters_per_cone ?? null

  emit('submit', {
    thread_type_id: threadType.id,
    thread_type_name: threadType.name,
    supplier_name: threadType.supplier_data?.name ?? '',
    supplier_id: threadType.supplier_id ?? null,
    tex_number: threadType.tex_number ?? '',
    thread_color: color?.name ?? null,
    thread_color_code: color?.pantone_code ?? null,
    thread_color_id: color?.id ?? null,
    meters_per_cone: metersPerCone,
    total_meters: metersPerCone ? metersPerCone * cones.value : 0,
    total_cones: cones.value,
    total_final: cones.value,
    lead_time_days: threadType.lead_time_days ?? null,
  })

  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    threadTypeId.value = null
    colorId.value = null
    cones.value = 1
    loadOptions()
  },
)
</script>

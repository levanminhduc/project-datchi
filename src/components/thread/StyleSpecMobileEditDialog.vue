<template>
  <q-dialog
    v-model="dialogOpen"
    position="bottom"
    @hide="onHide"
  >
    <q-card style="width: 100%; max-width: 600px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Sửa định mức chỉ
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

      <q-card-section class="q-gutter-md">
        <q-select
          v-model="form.process_name"
          :options="filteredProcessOptions"
          label="Công đoạn"
          outlined
          dense
          use-input
          input-debounce="200"
          fill-input
          hide-selected
          new-value-mode="add-unique"
          @filter="filterProcess"
          @input-value="(val) => { form.process_name = val }"
        />

        <q-select
          v-model="form.supplier_id"
          :options="filteredSupplierOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          label="Nhà cung cấp"
          outlined
          dense
          use-input
          input-debounce="200"
          fill-input
          hide-selected
          @filter="filterSupplier"
        />

        <q-select
          v-model="form.thread_type_id"
          :options="texDisplayOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          label="Tex"
          outlined
          dense
          use-input
          input-debounce="200"
          fill-input
          hide-selected
          :disable="!form.supplier_id"
          :loading="form.supplier_id != null && texLoading"
          loading-label="Đang tải Tex..."
          :hint="!form.supplier_id ? 'Chọn NCC trước' : ''"
          @filter="filterTex"
        />

        <q-input
          v-model.number="form.meters_per_unit"
          type="number"
          label="Mét/SP"
          outlined
          dense
          step="0.01"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
        <q-btn
          v-close-popup
          flat
          label="Hủy"
          color="grey"
        />
        <q-btn
          unelevated
          color="primary"
          label="Lưu"
          :loading="saving"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { StyleThreadSpec } from '@/types/thread'

interface SupplierOption { label: string; value: number }
interface TexOption { label: string; value: number }

interface Props {
  modelValue: boolean
  row: StyleThreadSpec | null
  supplierOptions: SupplierOption[]
  processNameOptions: string[]
  loadTexForSupplier: (supplierId: number) => Promise<TexOption[]>
  isTexLoading: (supplierId: number | null) => boolean
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { process_name: string; supplier_id: number | null; thread_type_id: number | null; meters_per_unit: number }]
}>()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = ref({
  process_name: '',
  supplier_id: null as number | null,
  thread_type_id: null as number | null,
  meters_per_unit: 0,
})

const texDisplayOptions = ref<TexOption[]>([])
const texLoading = ref(false)
const allTexForSupplier = ref<TexOption[]>([])

const filteredProcessOptions = ref<string[]>([])
const filterProcess = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (!val) {
      filteredProcessOptions.value = props.processNameOptions
      return
    }
    const needle = val.toLowerCase()
    filteredProcessOptions.value = props.processNameOptions.filter(n => n.toLowerCase().includes(needle))
  })
}

const filteredSupplierOptions = ref<SupplierOption[]>([])
const filterSupplier = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (!val) {
      filteredSupplierOptions.value = props.supplierOptions
      return
    }
    const needle = val.toLowerCase()
    filteredSupplierOptions.value = props.supplierOptions.filter(o => o.label.toLowerCase().includes(needle))
  })
}

const filterTex = async (val: string, update: (fn: () => void) => void, abort: () => void) => {
  if (!form.value.supplier_id) {
    abort()
    return
  }
  texLoading.value = true
  try {
    allTexForSupplier.value = await props.loadTexForSupplier(form.value.supplier_id)
  } finally {
    texLoading.value = false
  }
  update(() => {
    if (!val) {
      texDisplayOptions.value = allTexForSupplier.value
      return
    }
    const needle = val.toLowerCase()
    texDisplayOptions.value = allTexForSupplier.value.filter(o => o.label.toLowerCase().includes(needle))
  })
}

watch(() => props.row, (row) => {
  if (row) {
    form.value = {
      process_name: row.process_name ?? '',
      supplier_id: row.supplier_id ?? null,
      thread_type_id: row.thread_type_id ?? null,
      meters_per_unit: row.meters_per_unit ?? 0,
    }
  }
}, { immediate: true })

watch(() => form.value.supplier_id, async (newId, oldId) => {
  if (newId !== oldId && newId !== null) {
    form.value.thread_type_id = null
    allTexForSupplier.value = await props.loadTexForSupplier(newId)
    texDisplayOptions.value = allTexForSupplier.value
  }
})

const onHide = () => {
  form.value = { process_name: '', supplier_id: null, thread_type_id: null, meters_per_unit: 0 }
  texDisplayOptions.value = []
  allTexForSupplier.value = []
}

const handleSave = () => {
  emit('save', { ...form.value })
}
</script>

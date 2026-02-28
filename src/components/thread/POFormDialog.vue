<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { POStatus } from '@/types/thread/enums'
import type { PurchaseOrder, CreatePurchaseOrderDTO, UpdatePurchaseOrderDTO } from '@/types/thread'

interface Props {
  modelValue: boolean
  purchaseOrder?: PurchaseOrder | null
}

const props = withDefaults(defineProps<Props>(), {
  purchaseOrder: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const snackbar = useSnackbar()
const loading = ref(false)

const isEdit = computed(() => !!props.purchaseOrder)
const title = computed(() => isEdit.value ? 'Chỉnh sửa PO' : 'Tạo PO mới')

const form = ref<{
  po_number: string
  customer_name: string
  order_date: string | null
  delivery_date: string | null
  status: POStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes: string
}>({
  po_number: '',
  customer_name: '',
  order_date: null,
  delivery_date: null,
  status: POStatus.PENDING,
  priority: 'NORMAL',
  notes: ''
})

const statusOptions = [
  { label: 'Chờ xử lý', value: POStatus.PENDING },
  { label: 'Đã xác nhận', value: POStatus.CONFIRMED },
  { label: 'Đang sản xuất', value: POStatus.IN_PRODUCTION },
  { label: 'Hoàn thành', value: POStatus.COMPLETED },
  { label: 'Đã hủy', value: POStatus.CANCELLED }
]

const priorityOptions = [
  { label: 'Thấp', value: 'LOW' },
  { label: 'Bình thường', value: 'NORMAL' },
  { label: 'Cao', value: 'HIGH' },
  { label: 'Khẩn cấp', value: 'URGENT' }
]

function resetForm() {
  if (props.purchaseOrder) {
    form.value = {
      po_number: props.purchaseOrder.po_number,
      customer_name: props.purchaseOrder.customer_name || '',
      order_date: props.purchaseOrder.order_date,
      delivery_date: props.purchaseOrder.delivery_date,
      status: props.purchaseOrder.status,
      priority: props.purchaseOrder.priority,
      notes: props.purchaseOrder.notes || ''
    }
  } else {
    form.value = {
      po_number: '',
      customer_name: '',
      order_date: null,
      delivery_date: null,
      status: POStatus.PENDING,
      priority: 'NORMAL',
      notes: ''
    }
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

watch(() => props.purchaseOrder, () => {
  if (props.modelValue) {
    resetForm()
  }
}, { deep: true })

async function onSubmit() {
  if (!form.value.po_number.trim()) {
    snackbar.error('Vui lòng nhập số PO')
    return
  }

  loading.value = true
  try {
    if (isEdit.value && props.purchaseOrder) {
      const updateData: UpdatePurchaseOrderDTO = {
        po_number: form.value.po_number,
        customer_name: form.value.customer_name || undefined,
        order_date: form.value.order_date || undefined,
        delivery_date: form.value.delivery_date || undefined,
        status: form.value.status,
        priority: form.value.priority,
        notes: form.value.notes || undefined
      }
      await purchaseOrderService.update(props.purchaseOrder.id, updateData)
      snackbar.success('Cập nhật PO thành công')
    } else {
      const createData: CreatePurchaseOrderDTO = {
        po_number: form.value.po_number,
        customer_name: form.value.customer_name || undefined,
        order_date: form.value.order_date || undefined,
        delivery_date: form.value.delivery_date || undefined,
        status: form.value.status,
        priority: form.value.priority,
        notes: form.value.notes || undefined
      }
      await purchaseOrderService.create(createData)
      snackbar.success('Tạo PO thành công')
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    snackbar.error((err as Error).message || 'Có lỗi xảy ra')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    :title="title"
    :loading="loading"
    max-width="600px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.po_number"
          label="Số PO"
          required
          :disable="isEdit"
        />
      </div>

      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.customer_name"
          label="Khách hàng"
        />
      </div>

      <div class="col-12 col-sm-6">
        <DatePicker
          v-model="form.order_date"
          label="Ngày đặt"
        />
      </div>

      <div class="col-12 col-sm-6">
        <DatePicker
          v-model="form.delivery_date"
          label="Ngày giao"
        />
      </div>

      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.status"
          :options="statusOptions"
          label="Trạng thái"
          emit-value
          map-options
        />
      </div>

      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.priority"
          :options="priorityOptions"
          label="Ưu tiên"
          emit-value
          map-options
        />
      </div>

      <div class="col-12">
        <AppTextarea
          v-model="form.notes"
          label="Ghi chú"
          rows="2"
        />
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { OverQuotaFilters } from '@/types/thread/overQuota'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { styleService } from '@/services/styleService'
import { dateRules } from '@/utils'

const filters = defineModel<OverQuotaFilters>('filters', { required: true })

const emit = defineEmits<{
  apply: []
  clear: []
}>()

const poOptions = ref<{ value: number; label: string }[]>([])
const styleOptions = ref<{ value: number; label: string }[]>([])

const deptOptions = [
  { value: 'May', label: 'May' },
  { value: 'Cat', label: 'Cắt' },
  { value: 'Hoan Thanh', label: 'Hoàn Thành' },
  { value: 'QC', label: 'QC' },
]

const reasonOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ky_thuat', label: 'Kỹ Thuật' },
  { value: 'rai_dau_may', label: 'Rãi đầu máy' },
]

async function loadFilterOptions() {
  try {
    const [pos, styles] = await Promise.all([
      purchaseOrderService.getAll(),
      styleService.getAll(),
    ])
    poOptions.value = pos.map((po) => ({
      value: po.id,
      label: po.po_number,
    }))
    styleOptions.value = styles.map((s) => ({
      value: s.id,
      label: s.style_code,
    }))
  } catch {
    // silent
  }
}

onMounted(loadFilterOptions)
</script>

<template>
  <q-card
    flat
    bordered
    class="q-mb-md"
    style="position: sticky; top: 50px; z-index: 10"
  >
    <q-card-section class="q-py-sm">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-sm-6 col-md-2">
          <AppInput
            v-model="filters.date_from"
            label="Từ ngày"
            placeholder="DD/MM/YYYY"
            :rules="[dateRules.date]"
            dense
            clearable
          >
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <DatePicker v-model="filters.date_from" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <AppInput
            v-model="filters.date_to"
            label="Đến ngày"
            placeholder="DD/MM/YYYY"
            :rules="[dateRules.date]"
            dense
            clearable
          >
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <DatePicker v-model="filters.date_to" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <AppSelect
            v-model="filters.po_ids"
            :options="poOptions"
            label="PO"
            multiple
            use-input
            use-chips
            clearable
            dense
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <AppSelect
            v-model="filters.style_ids"
            :options="styleOptions"
            label="Mã hàng"
            multiple
            use-input
            use-chips
            clearable
            dense
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <AppSelect
            v-model="filters.departments"
            :options="deptOptions"
            label="Phòng ban"
            multiple
            clearable
            dense
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <AppSelect
            v-model="filters.reason"
            :options="reasonOptions"
            label="Lý do vượt"
            dense
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-toggle
            v-model="filters.only_over_quota"
            label="Chỉ hiện vượt ĐM"
            dense
            color="negative"
          />
        </div>

        <div class="col-12 col-sm-auto">
          <div class="row q-gutter-sm">
            <AppButton
              label="Lọc"
              icon="filter_list"
              color="primary"
              dense
              @click="emit('apply')"
            />
            <AppButton
              label="Xóa bộ lọc"
              icon="clear"
              color="grey"
              variant="flat"
              dense
              @click="emit('clear')"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<template>
  <div>
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-weight-medium col">
        Tóm Tắt Giao Hàng
      </div>
      <div class="row q-gutter-sm items-center">
        <AppButton
          flat
          dense
          size="sm"
          icon="refresh"
          :loading="loading"
          @click="$emit('refresh')"
        >
          <AppTooltip>Tải lại</AppTooltip>
        </AppButton>
      </div>
    </div>

    <template v-if="loading && !summary">
      <div class="row justify-center q-py-md">
        <q-spinner-dots
          size="32px"
          color="primary"
        />
      </div>
    </template>

    <template v-else-if="!summary || summary.total_ordered === 0">
      <div class="text-center text-grey q-pa-md">
        Chưa có dữ liệu giao hàng
      </div>
    </template>

    <template v-else>
      <!-- KPI Cards -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
          >
            <q-card-section class="text-center">
              <div class="text-caption text-grey-6 q-mb-xs">
                Đặt NCC
              </div>
              <div class="text-h5 text-weight-bold text-primary">
                {{ summary.total_ordered }}
              </div>
              <div class="text-caption text-grey-5">
                cuộn
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
          >
            <q-card-section class="text-center">
              <div class="text-caption text-grey-6 q-mb-xs">
                NCC đã giao
              </div>
              <div class="text-h5 text-weight-bold text-positive">
                {{ summary.total_delivered }}
              </div>
              <div class="text-caption text-grey-5">
                cuộn
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card
            flat
            bordered
          >
            <q-card-section class="text-center">
              <div class="text-caption text-grey-6 q-mb-xs">
                Đã nhập kho
              </div>
              <div class="text-h5 text-weight-bold text-info">
                {{ summary.total_received }}
              </div>
              <div class="text-caption text-grey-5">
                cuộn
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="q-mb-md">
        <div class="row items-center q-mb-xs">
          <span class="text-caption text-grey-7 col">Tiến độ nhập kho</span>
          <span class="text-caption text-weight-medium">{{ summary.percent_received }}%</span>
        </div>
        <q-linear-progress
          :value="summary.percent_received / 100"
          color="positive"
          track-color="grey-3"
          rounded
          size="12px"
        />
      </div>

      <!-- Breakdown Table -->
      <q-markup-table
        flat
        bordered
        dense
        separator="horizontal"
        class="delivery-table"
      >
        <thead>
          <tr>
            <th class="text-left">
              NCC
            </th>
            <th class="text-left">
              Tex
            </th>
            <th class="text-left">
              Màu
            </th>
            <th class="text-right">
              Đặt
            </th>
            <th class="text-right">
              Đã giao
            </th>
            <th class="text-right">
              Đã nhập
            </th>
            <th class="text-right">
              Chờ giao
            </th>
            <th class="text-right">
              Chờ nhập
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in summary.by_supplier"
            :key="idx"
          >
            <td>{{ row.supplier_name || '-' }}</td>
            <td>{{ row.tex_number || '-' }}</td>
            <td>{{ row.color_name || '-' }}</td>
            <td class="text-right">
              {{ row.ordered }}
            </td>
            <td class="text-right text-positive">
              {{ row.delivered }}
            </td>
            <td class="text-right text-info">
              {{ row.received }}
            </td>
            <td
              class="text-right"
              :class="row.pending_delivery > 0 ? 'text-warning text-weight-medium' : 'text-grey-5'"
            >
              {{ row.pending_delivery }}
            </td>
            <td
              class="text-right"
              :class="row.pending_receive > 0 ? 'text-warning text-weight-medium' : 'text-grey-5'"
            >
              {{ row.pending_receive }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <!-- Link to detail page -->
      <div class="row justify-end q-mt-sm">
        <AppButton
          flat
          dense
          size="sm"
          color="primary"
          icon="open_in_new"
          label="Xem chi tiết giao hàng"
          @click="router.push('/thread/weekly-order/deliveries')"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { DeliverySummary } from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'

defineProps<{
  summary: DeliverySummary | null
  loading: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

const router = useRouter()
</script>

<style scoped lang="scss">
.delivery-table {
  th {
    background: #f5f5f5;
    font-weight: 500;
    font-size: 12px;
  }
  td {
    font-size: 13px;
  }
}
</style>

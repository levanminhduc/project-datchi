<template>
  <AppDialog
    :model-value="modelValue"
    class="week-history-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Lịch sử tuần đặt hàng
    </template>

    <AppInput
      v-model="search"
      placeholder="Nhập thông tin đơn hàng, người tạo..."
      dense
      clearable
      class="q-mb-sm"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </AppInput>

    <q-table
      :rows="filteredWeeks"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="loading"
      :rows-per-page-options="[10, 20]"
      style="min-height: 400px"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <AppBadge
            :label="statusLabel(props.value)"
            :color="statusColor(props.value)"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <AppButton
            flat
            dense
            icon="file_open"
            color="primary"
            size="sm"
            @click="$emit('load', props.row.id)"
          >
            <AppTooltip>Tải tuần này</AppTooltip>
          </AppButton>
          <AppButton
            flat
            dense
            icon="open_in_new"
            color="grey"
            size="sm"
            @click="openDetail(props.row.id)"
          >
            <AppTooltip>Xem chi tiết</AppTooltip>
          </AppButton>
        </q-td>
      </template>
      <template #no-data>
        <div class="text-center text-grey q-pa-md">
          Chưa có tuần đặt hàng nào
        </div>
      </template>
    </q-table>

    <template #actions>
      <AppButton
        v-close-popup
        flat
        label="Đóng"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { QTableColumn } from "quasar";
import type { ThreadOrderWeek } from "@/types/thread";
import AppInput from "@/components/ui/inputs/AppInput.vue";

const props = defineProps<{
  modelValue: boolean;
  weeks: ThreadOrderWeek[];
  loading: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  load: [weekId: number];
}>();

const search = ref("");
const dialogMinWidth = ref<number | null>(null);

const filteredWeeks = computed(() => {
  if (!search.value.trim()) return props.weeks;
  const q = search.value.toLowerCase();
  return props.weeks.filter(
    (w) =>
      w.week_name?.toLowerCase().includes(q) ||
      w.created_by?.toLowerCase().includes(q),
  );
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && dialogMinWidth.value === null) {
      await nextTick();
      setTimeout(() => {
        const card = document.querySelector(
          ".week-history-dialog .q-card",
        ) as HTMLElement;
        if (card) {
          dialogMinWidth.value = card.offsetWidth;
          card.style.minWidth = `${dialogMinWidth.value}px`;
        }
      }, 50);
    }
    if (!isOpen) {
      dialogMinWidth.value = null;
    }
  },
);

function openDetail(weekId: number) {
  window.open(`/thread/weekly-order/${weekId}`, "_blank");
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Nháp",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
  };
  return map[status.toLowerCase()] || status;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "grey",
    confirmed: "positive",
    cancelled: "negative",
  };
  return map[status.toLowerCase()] || "grey";
}

function formatDate(val: string | null): string {
  if (!val) return "—";
  const [y, m, d] = val.split("-");
  return `${d}/${m}/${y}`;
}

const columns: QTableColumn[] = [
  {
    name: "week_name",
    label: "Đơn hàng",
    field: "week_name",
    align: "left",
    sortable: true,
  },
  {
    name: "start_date",
    label: "Ngày Giao",
    field: "start_date",
    align: "left",
    format: (val: string | null) => formatDate(val),
  },
  {
    name: "created_by",
    label: "Người tạo",
    field: "created_by",
    align: "left",
    format: (val: string | null) => val || "—",
  },
  { name: "status", label: "Trạng thái", field: "status", align: "center" },
  {
    name: "item_count",
    label: "Số items",
    field: "item_count",
    align: "right",
    format: (val: number | undefined) => val?.toString() || "0",
  },
  { name: "actions", label: "", field: "id", align: "center" },
];
</script>

<style>
.week-history-dialog .q-card {
  max-width: 95vw !important;
}

.week-history-dialog .q-table th,
.week-history-dialog .q-table td {
  white-space: nowrap;
}
</style>

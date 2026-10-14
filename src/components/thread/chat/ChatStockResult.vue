<template>
  <ul
    v-if="listLayout"
    class="stock-list"
    aria-label="Tồn khả dụng theo NCC, Tex và màu"
  >
    <li
      v-for="(row, index) in rows"
      :key="`${row.id}-${index}`"
      class="stock-list__item"
    >
      <div class="stock-list__title">
        {{ describeThread(row) }}
      </div>
      <div class="stock-list__detail">
        {{ describeQuantity(row) }}
      </div>
    </li>
  </ul>

  <div
    v-else
    class="stock-table-wrap"
    tabindex="0"
    role="region"
    aria-label="Bảng tồn khả dụng theo NCC, Tex và màu"
  >
    <table class="stock-table">
      <thead>
        <tr>
          <th scope="col">
            NCC
          </th>
          <th scope="col">
            Tex
          </th>
          <th scope="col">
            Màu
          </th>
          <th
            scope="col"
            class="is-number"
          >
            Cuộn nguyên
          </th>
          <th
            scope="col"
            class="is-number"
          >
            Cuộn lẻ
          </th>
          <th
            scope="col"
            class="is-number"
          >
            Mét lẻ
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="`${row.id}-${index}`"
        >
          <td>{{ row.supplierName }}</td>
          <td class="is-nowrap">
            {{ row.texLabel }}
          </td>
          <td>{{ row.colorName }}</td>
          <td class="is-number">
            {{ formatChatNumber(row.fullCones) }}
          </td>
          <td class="is-number">
            {{ formatChatNumber(row.partialCones) }}
          </td>
          <td class="is-number">
            {{ formatChatNumber(row.partialMeters) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  formatChatNumber,
  type StockTableRow,
} from '@/components/thread/chat-assistant-presentation'

const props = withDefaults(
  defineProps<{
    rows: StockTableRow[]
    compact?: boolean
  }>(),
  { compact: false },
)

const $q = useQuasar()

const listLayout = computed(() => props.compact || $q.screen.lt.sm)

function describeThread(row: StockTableRow): string {
  return [row.supplierName, row.texLabel, row.colorName].filter(Boolean).join(' · ')
}

function describeQuantity(row: StockTableRow): string {
  const parts: string[] = []
  if (row.fullCones > 0) parts.push(`${formatChatNumber(row.fullCones)} nguyên`)
  if (row.partialCones > 0) parts.push(`${formatChatNumber(row.partialCones)} lẻ`)
  if (row.partialMeters > 0) parts.push(`${formatChatNumber(row.partialMeters)} m`)
  return parts.length > 0 ? parts.join(' · ') : 'Hết hàng'
}
</script>

<style scoped lang="scss">
.stock-table-wrap {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  background: var(--chat-surface);

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
  }
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.4;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--chat-border);
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    background: var(--chat-hover);
    color: var(--chat-muted);
    font-size: 12px;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .is-number {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .is-nowrap {
    white-space: nowrap;
  }
}

.stock-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  background: var(--chat-surface);
}

.stock-list__item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--chat-border);

  &:last-child {
    border-bottom: 0;
  }
}

.stock-list__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.stock-list__detail {
  margin-top: 2px;
  color: var(--chat-muted);
  font-size: 13px;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}
</style>

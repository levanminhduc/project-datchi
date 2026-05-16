<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="column no-wrap">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">
          Lịch sử xuất chỉ: {{ threadLabel }}
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="col scroll q-pa-sm">
        <div
          v-if="loading"
          class="column items-center q-pa-lg"
        >
          <q-spinner
            size="32px"
            color="primary"
          />
          <span class="q-mt-sm text-grey">Đang tải...</span>
        </div>

        <div
          v-else-if="poGroups.length === 0"
          class="full-width column items-center q-pa-lg text-grey"
        >
          <q-icon
            name="history"
            size="48px"
            class="q-mb-md"
          />
          <span>Chưa có lịch sử xuất chỉ</span>
        </div>

        <q-list
          v-else
          bordered
          separator
        >
          <q-expansion-item
            v-for="(group, idx) in poGroups"
            :key="idx"
            :default-opened="poGroups.length <= 3"
            dense
            header-class="bg-grey-1"
          >
            <template #header>
              <q-item-section avatar>
                <q-icon
                  name="inventory_2"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ group.po_number || 'Không có PO' }}
                </q-item-label>
                <q-item-label caption>
                  {{ group.lines.length }} dòng xuất &middot; Lần cuối: {{ formatDate(group.last_issued_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-sm">
                  <q-badge
                    v-if="group.total_net_full > 0"
                    color="positive"
                    :label="`${group.total_net_full} nguyên`"
                    class="q-pa-xs"
                  />
                  <q-badge
                    v-if="group.total_net_partial > 0"
                    color="warning"
                    :label="`${group.total_net_partial} lẻ`"
                    class="q-pa-xs"
                  />
                </div>
              </q-item-section>
            </template>

            <q-table
              :rows="group.lines"
              :columns="lineColumns"
              :rows-per-page-options="[0]"
              flat
              dense
              hide-bottom
              class="q-mx-sm q-mb-sm"
            >
              <template #body-cell-issued_at="slotProps">
                <q-td :props="slotProps">
                  {{ formatDate(slotProps.value) }}
                </q-td>
              </template>

              <template #body-cell-net_full="slotProps">
                <q-td
                  :props="slotProps"
                  class="text-center"
                >
                  <q-badge
                    v-if="slotProps.value > 0"
                    color="positive"
                    :label="slotProps.value"
                    class="q-pa-xs"
                  />
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </q-td>
              </template>

              <template #body-cell-net_partial="slotProps">
                <q-td
                  :props="slotProps"
                  class="text-center"
                >
                  <q-badge
                    v-if="slotProps.value > 0"
                    color="warning"
                    :label="slotProps.value"
                    class="q-pa-xs"
                  />
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </q-td>
              </template>

              <template #bottom-row>
                <q-tr class="bg-grey-2 text-weight-bold">
                  <q-td
                    colspan="5"
                    class="text-right"
                  >
                    Tổng cộng:
                  </q-td>
                  <q-td class="text-center">
                    <q-badge
                      color="positive"
                      :label="group.total_net_full"
                      class="q-pa-xs"
                    />
                  </q-td>
                  <q-td class="text-center">
                    <q-badge
                      v-if="group.total_net_partial > 0"
                      color="warning"
                      :label="group.total_net_partial"
                      class="q-pa-xs"
                    />
                    <span
                      v-else
                      class="text-grey"
                    >-</span>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import type { ConeSummaryRow } from '@/types/thread'
import { issueV2Service } from '@/services/issueV2Service'

interface Props {
  modelValue: boolean
  threadType: ConeSummaryRow | null
}

const props = defineProps<Props>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

type IssueLine = {
  issue_code: string
  style_code: string | null
  style_color_name: string | null
  created_by: string
  issued_at: string
  net_full: number
  net_partial: number
}

type PoGroup = {
  po_number: string | null
  total_net_full: number
  total_net_partial: number
  last_issued_at: string
  lines: IssueLine[]
}

const poGroups = ref<PoGroup[]>([])
const loading = ref(false)

const threadLabel = computed(() => {
  if (!props.threadType) return ''
  const parts = [
    props.threadType.supplier_name,
    props.threadType.tex_number ? `TEX ${props.threadType.tex_label || props.threadType.tex_number}` : null,
    props.threadType.color_data?.name,
  ].filter(Boolean)
  return parts.join(' - ')
})

const lineColumns: QTableColumn[] = [
  { name: 'issue_code', label: 'Mã phiếu', field: 'issue_code', align: 'left' },
  { name: 'style_code', label: 'Style', field: 'style_code', align: 'left' },
  { name: 'style_color_name', label: 'Màu Hàng', field: 'style_color_name', align: 'left' },
  { name: 'created_by', label: 'Người xuất', field: 'created_by', align: 'left' },
  { name: 'issued_at', label: 'Thời gian', field: 'issued_at', align: 'left' },
  { name: 'net_full', label: 'Cuộn nguyên', field: 'net_full', align: 'center' },
  { name: 'net_partial', label: 'Cuộn lẻ', field: 'net_partial', align: 'center' },
]

function formatDate(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

async function fetchData() {
  if (!props.threadType) return
  loading.value = true
  try {
    const result = await issueV2Service.getIssueHistoryByThreadType({
      thread_type_id: props.threadType.thread_type_id,
      thread_color_id: props.threadType.color_id,
    })
    poGroups.value = result.items
  } catch {
    poGroups.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.threadType) {
      fetchData()
    }
  },
)
</script>

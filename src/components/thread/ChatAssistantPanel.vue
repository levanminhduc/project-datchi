<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-lg-8">
      <AppCard
        bordered
        flat
        class="chat-panel"
      >
        <div
          ref="messagesEl"
          class="messages"
        >
          <div
            v-for="item in messages"
            :key="item.id"
            class="message-row row"
            :class="item.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="message-bubble"
              :class="[
                item.role,
                {
                  thinking: item.status === 'thinking',
                  'has-stock-table': item.stockRows?.length,
                },
              ]"
            >
              <div
                class="message-text"
                :aria-live="item.status === 'thinking' ? 'polite' : undefined"
              >
                {{ item.text }}
                <span
                  v-if="item.status === 'thinking'"
                  class="thinking-dots"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
              </div>

              <div
                v-if="item.stockRows?.length"
                class="stock-table-wrap"
              >
                <table
                  class="stock-table"
                  aria-label="Bảng tồn khả dụng theo nhà cung cấp, Tex và màu"
                >
                  <thead>
                    <tr>
                      <th>NCC</th>
                      <th>Tex</th>
                      <th>Màu</th>
                      <th class="text-right">
                        Cuộn nguyên
                      </th>
                      <th class="text-right">
                        Cuộn lẻ
                      </th>
                      <th class="text-right">
                        Mét lẻ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in item.stockRows"
                      :key="row.id"
                    >
                      <td class="supplier-cell">
                        {{ row.supplierName }}
                      </td>
                      <td>{{ row.texLabel }}</td>
                      <td>{{ row.colorName }}</td>
                      <td class="number-cell">
                        {{ formatNumber(row.fullCones) }}
                      </td>
                      <td class="number-cell">
                        {{ formatNumber(row.partialCones) }}
                      </td>
                      <td class="number-cell">
                        {{ formatNumber(row.partialMeters) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <q-separator />

        <form
          class="row q-col-gutter-sm q-pa-md"
          @submit.prevent="sendMessage"
        >
          <div class="col">
            <AppInput
              v-model="draft"
              placeholder="VD: C9700 còn bao nhiêu cuộn, dùng cho mã hàng nào?"
              aria-label="Câu hỏi tra cứu chỉ"
              hide-bottom-space
              dense
              outlined
              autofocus
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </AppInput>
          </div>
          <div class="col-auto">
            <AppButton
              type="submit"
              icon="send"
              :loading="loading"
              :disable="!draft.trim()"
              aria-label="Gửi câu hỏi"
            />
          </div>
        </form>
      </AppCard>
    </div>

    <div class="col-12 col-lg-4">
      <AppCard
        bordered
        flat
        class="q-pa-md"
      >
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold">
            Câu hỏi nhanh
          </div>
          <AppButton
            icon="refresh"
            variant="flat"
            round
            aria-label="Xóa hội thoại"
            @click="resetChat"
          />
        </div>
        <div class="column q-gutter-sm">
          <AppButton
            v-for="question in quickQuestions"
            :key="question"
            :label="question"
            icon="bolt"
            variant="outlined"
            align="left"
            no-caps
            @click="askQuick(question)"
          />
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppCard from '@/components/ui/cards/AppCard.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { chatAssistantService } from '@/services'
import type { ChatAssistantResult, ChatAssistantStockRow } from '@/types/thread'

interface StockTableRow {
  id: string
  supplierName: string
  texLabel: string
  colorName: string
  fullCones: number
  partialCones: number
  partialMeters: number
}

interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  status?: 'thinking'
  stockRows?: StockTableRow[]
}

const quickQuestions = [
  'C9700 còn bao nhiêu cuộn?',
  'Chỉ C9700 dùng cho mã hàng nào?',
  'Tex 40 màu C9700 còn bao nhiêu cuộn?',
]

const initialMessage: ChatMessage = {
  id: 1,
  role: 'assistant',
  text: 'Nhập mã màu hoặc loại chỉ để tra cứu nhanh tồn kho và mã hàng liên quan.',
}

const draft = ref('')
const loading = ref(false)
const messages = ref<ChatMessage[]>([initialMessage])
const messagesEl = ref<{ scrollTop: number; scrollHeight: number } | null>(null)
let nextId = 2
const MIN_ASSISTANT_THINKING_MS = 800

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function scrollToBottom() {
  void nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function sendMessage() {
  const message = draft.value.trim()
  if (!message || loading.value) return

  messages.value.push({ id: nextId++, role: 'user', text: message })
  const assistantId = nextId++
  messages.value.push({
    id: assistantId,
    role: 'assistant',
    text: 'Trợ lý đang suy nghĩ',
    status: 'thinking',
  })
  draft.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const result = await waitForAssistantThinking(chatAssistantService.query(message))
    const stockRows = buildStockTableRows(result)
    updateAssistantMessage(assistantId, formatAssistantText(result.answer, stockRows), stockRows)
  } catch (error) {
    const text = error instanceof Error ? error.message : 'Lỗi khi tra cứu'
    updateAssistantMessage(assistantId, text)
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function updateAssistantMessage(id: number, text: string, stockRows: StockTableRow[] = []) {
  const message = messages.value.find((item) => item.id === id)
  if (!message) return

  message.text = text
  message.status = undefined
  message.stockRows = stockRows.length > 0 ? stockRows : undefined
}

async function waitForAssistantThinking<T>(promise: Promise<T>): Promise<T> {
  const [settled] = await Promise.all([
    promise.then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason }),
    ),
    wait(MIN_ASSISTANT_THINKING_MS),
  ])

  if (settled.status === 'rejected') throw settled.reason
  return settled.value
}

function askQuick(question: string) {
  draft.value = question
  void sendMessage()
}

function resetChat() {
  messages.value = [{ ...initialMessage, id: 1 }]
  draft.value = ''
  nextId = 2
}

function buildStockTableRows(result: ChatAssistantResult): StockTableRow[] {
  if (result.stock.length > 0) {
    return result.stock.map((row) => mapFallbackStockRow(row))
  }

  return extractContextRows(result.context)
    .filter(isInventoryContextRow)
    .map((row, index) => mapContextStockRow(row, result.term, index))
}

function mapFallbackStockRow(row: ChatAssistantStockRow): StockTableRow {
  return {
    id: `stock-${row.thread_type_id}-${row.color_name ?? 'none'}`,
    supplierName: row.supplier_name || 'Không rõ NCC',
    texLabel: formatTexLabel(row.tex_number),
    colorName: row.color_name || row.thread_name || row.thread_code,
    fullCones: row.available_full_cones,
    partialCones: row.available_partial_cones,
    partialMeters: row.partial_meters,
  }
}

function mapContextStockRow(
  row: Record<string, unknown>,
  fallbackTerm: string | null,
  index: number,
): StockTableRow {
  const colorName = readColorName(row) || readString(row, 'thread_name', 'thread_code') || fallbackTerm || '-'

  return {
    id: [
      'context',
      readString(row, 'thread_type_id', 'thread_code') || index,
      readString(row, 'supplier_name') || 'none',
      readString(row, 'color_id') || colorName,
      index,
    ].join('-'),
    supplierName: readString(row, 'supplier_name') || 'Không rõ NCC',
    texLabel: formatTexLabel(readString(row, 'tex_label', 'tex_number')),
    colorName,
    fullCones: readNumber(row, 'full_cones', 'available_full_cones'),
    partialCones: readNumber(row, 'partial_cones', 'available_partial_cones'),
    partialMeters: readNumber(row, 'partial_meters'),
  }
}

function extractContextRows(context: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(context)) return context.filter(isRecord)
  if (!isRecord(context)) return []

  for (const key of ['rows', 'data', 'items', 'stock']) {
    const value = context[key]
    if (Array.isArray(value)) return value.filter(isRecord)
  }

  return []
}

function isInventoryContextRow(row: Record<string, unknown>): boolean {
  return [
    'full_cones',
    'partial_cones',
    'available_full_cones',
    'available_partial_cones',
  ].some((key) => key in row)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]
    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) {
      return String(value).trim()
    }
  }
  return null
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key]
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function readColorName(row: Record<string, unknown>): string | null {
  const colorData = row.color_data
  if (isRecord(colorData)) {
    const name = readString(colorData, 'name')
    if (name) return name
  }

  return readString(row, 'color_name')
}

function formatTexLabel(value: string | null): string {
  if (!value) return 'Tex ?'
  return value.toLocaleLowerCase('vi-VN').startsWith('tex') ? value : `Tex ${value}`
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })
}

function formatAssistantText(answer: string, stockRows: StockTableRow[]): string {
  if (stockRows.length === 0) return answer

  const lines = answer.split('\n')
  const formatted: string[] = []
  let skippingStockBullets = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Tồn khả dụng của') || trimmed.startsWith('Chưa thấy tồn kho')) {
      formatted.push(line)
      skippingStockBullets = true
      continue
    }

    if (skippingStockBullets && trimmed.startsWith('- ')) {
      continue
    }

    if (skippingStockBullets && trimmed) {
      skippingStockBullets = false
    }
    formatted.push(line)
  }

  return formatted.join('\n').trim()
}
</script>

<style scoped lang="scss">
.chat-panel {
  overflow: hidden;
  min-width: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  height: min(62vh, 620px);
  min-height: 360px;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 12px;
  padding: 18px;
  scrollbar-gutter: stable;
  background: linear-gradient(180deg, rgba(0, 121, 107, 0.07), rgba(25, 118, 210, 0.04));
}

.message-row {
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
}

.message-bubble {
  max-width: min(720px, 88%);
  min-width: 0;
  border-radius: 8px;
  padding: 12px 14px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.message-bubble.assistant {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.message-bubble.has-stock-table {
  max-width: min(920px, 96%);
}

.message-bubble.thinking {
  color: #425466;
}

.message-bubble.user {
  background: var(--q-primary);
  color: white;
}

.message-text {
  line-height: 1.55;
  white-space: pre-wrap;
}

.stock-table-wrap {
  margin-top: 12px;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid #d7e0e5;
  border-radius: 6px;
  background: #fff;
}

.stock-table {
  width: 100%;
  min-width: 660px;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: normal;
  word-break: normal;
}

.stock-table th,
.stock-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #e8eef2;
  vertical-align: top;
}

.stock-table th {
  background: #f4f8fa;
  color: #51616f;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.stock-table tbody tr:last-child td {
  border-bottom: 0;
}

.stock-table tbody tr:hover {
  background: #f8fbfc;
}

.supplier-cell {
  min-width: 180px;
  font-weight: 600;
  color: #25313b;
}

.number-cell {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.thinking-dots {
  display: inline-flex;
  gap: 4px;
  margin-left: 6px;
  vertical-align: middle;
}

.thinking-dots span {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentcolor;
  opacity: 0.35;
  animation: thinking-pulse 1s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.16s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes thinking-pulse {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  40% {
    transform: translateY(-3px);
    opacity: 0.9;
  }
}
</style>

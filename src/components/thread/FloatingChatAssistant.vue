<template>
  <div
    class="floating-chat-assistant"
    :class="{ open: isOpen }"
  >
    <transition name="assistant-window">
      <section
        v-if="isOpen"
        class="assistant-window"
        role="dialog"
        aria-label="Trợ lý Chỉ AI"
        @keydown.esc="closeAssistant"
      >
        <header class="assistant-header">
          <div class="assistant-identity">
            <div class="assistant-avatar">
              <q-icon name="smart_toy" />
            </div>
            <div>
              <div class="assistant-title">
                Chỉ AI
              </div>
              <div class="assistant-status">
                <span class="status-dot" />
                Trực tuyến
              </div>
            </div>
          </div>

          <div class="header-actions">
            <AppButton
              icon="open_in_full"
              variant="flat"
              round
              dense
              aria-label="Mở trang trợ lý đầy đủ"
              @click="openFullAssistant"
            >
              <q-tooltip>Mở trang đầy đủ</q-tooltip>
            </AppButton>
            <AppButton
              icon="close"
              variant="flat"
              round
              dense
              aria-label="Đóng trợ lý"
              @click="closeAssistant"
            />
          </div>
        </header>

        <div
          ref="messagesEl"
          class="assistant-messages"
        >
          <div
            v-for="item in messages"
            :key="item.id"
            class="assistant-row"
            :class="item.role"
          >
            <div
              class="assistant-bubble"
              :class="{ thinking: item.status === 'thinking', 'with-table': item.stockRows?.length }"
            >
              <div class="assistant-text">
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
                  aria-label="Tồn khả dụng theo NCC, Tex và màu"
                >
                  <thead>
                    <tr>
                      <th>NCC</th>
                      <th>Tex</th>
                      <th>Màu</th>
                      <th>Nguyên</th>
                      <th>Lẻ</th>
                      <th>Mét lẻ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in item.stockRows"
                      :key="row.id"
                    >
                      <td>{{ row.supplierName }}</td>
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

        <div
          v-if="showQuickQuestions"
          class="quick-row"
        >
          <button
            v-for="question in quickQuestions"
            :key="question"
            class="quick-chip"
            type="button"
            :disabled="loading"
            @click="askQuick(question)"
          >
            {{ question }}
            <q-icon name="arrow_forward" />
          </button>
        </div>

        <form
          class="assistant-composer"
          @submit.prevent="sendMessage()"
        >
          <div class="composer-shell">
            <AppInput
              v-model="draft"
              class="composer-input"
              type="textarea"
              placeholder="Nhập mã màu, Tex hoặc mã hàng..."
              aria-label="Câu hỏi cho trợ lý Chỉ AI"
              hide-bottom-space
              autogrow
              borderless
              dense
              :outlined="false"
              :disable="loading"
              @keydown.enter.exact.prevent="sendMessage()"
            >
              <template #prepend>
                <q-icon name="manage_search" />
              </template>
            </AppInput>
            <div class="send-button-cell">
              <AppButton
                type="submit"
                icon="send"
                round
                :loading="loading"
                :disable="!draft.trim()"
                aria-label="Gửi câu hỏi"
              />
            </div>
          </div>
        </form>
      </section>
    </transition>

    <button
      class="assistant-launcher"
      type="button"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? 'Đóng trợ lý Chỉ AI' : 'Mở trợ lý Chỉ AI'"
      @click="toggleAssistant"
    >
      <span class="launcher-halo" />
      <span class="launcher-core">
        <q-icon :name="isOpen ? 'close' : 'smart_toy'" />
      </span>
      <span
        v-if="!isOpen"
        class="launcher-badge"
      >
        AI
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { chatAssistantService } from '@/services'
import {
  buildStockTableRows,
  formatAssistantText,
  formatChatNumber,
  type StockTableRow,
} from './chat-assistant-presentation'

interface FloatingChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  status?: 'thinking'
  stockRows?: StockTableRow[]
}

const router = useRouter()

const quickQuestions = [
  'BK còn bao nhiêu cuộn?',
  'C9700 còn bao nhiêu cuộn?',
  'Tex 40 màu C9700',
]

const initialMessage: FloatingChatMessage = {
  id: 1,
  role: 'assistant',
  text: 'Chào anh/chị. Em là Chỉ AI, hỗ trợ tra nhanh tồn kho và định mức chỉ.',
}

const isOpen = ref(false)
const loading = ref(false)
const draft = ref('')
const messages = ref<FloatingChatMessage[]>([{ ...initialMessage }])
const messagesEl = ref<HTMLElement | null>(null)
let nextId = 2

const MIN_ASSISTANT_THINKING_MS = 650
const showQuickQuestions = computed(() => !messages.value.some((item) => item.role === 'user'))

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toggleAssistant() {
  isOpen.value = !isOpen.value
  if (isOpen.value) scrollToBottom()
}

function closeAssistant() {
  isOpen.value = false
}

function scrollToBottom() {
  void nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function sendMessage(value?: string) {
  const message = (value ?? draft.value).trim()
  if (!message || loading.value) return

  messages.value.push({ id: nextId++, role: 'user', text: message })
  const assistantId = nextId++
  messages.value.push({
    id: assistantId,
    role: 'assistant',
    text: 'Đang tra cứu',
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
    updateAssistantMessage(assistantId, error instanceof Error ? error.message : 'Lỗi khi tra cứu')
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
  void sendMessage(question)
}

function openFullAssistant() {
  isOpen.value = false
  void router.push('/thread/chat-assistant')
}

function formatNumber(value: number): string {
  return formatChatNumber(value)
}
</script>

<style scoped lang="scss">
.floating-chat-assistant {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 3200;
  pointer-events: none;
}

.assistant-launcher,
.assistant-window {
  pointer-events: auto;
}

.assistant-launcher {
  position: relative;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  background: transparent;
  filter: drop-shadow(0 10px 18px rgba(0, 90, 210, 0.3));
}

.assistant-launcher:focus-visible {
  outline: 3px solid rgba(0, 166, 255, 0.45);
  outline-offset: 5px;
}

.launcher-halo {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(from 120deg, #16c7ff, #2563eb, #00b894, #16c7ff);
  opacity: 0.75;
  animation: ai-halo-spin 3.8s linear infinite;
}

.launcher-halo::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: inherit;
  background: #fff;
}

.launcher-core {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.78), transparent 26%),
    linear-gradient(135deg, #0b7dff, #0755db 54%, #0abf9f);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.72),
    inset 0 -8px 14px rgba(0, 39, 122, 0.34);
  font-size: 24px;
}

.launcher-badge {
  position: absolute;
  right: -4px;
  top: -5px;
  min-width: 22px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #0f5ee9;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(10, 70, 150, 0.2);
}

.assistant-window {
  position: absolute;
  right: 0;
  bottom: 62px;
  width: min(430px, calc(100vw - 28px));
  max-height: min(650px, calc(100vh - 116px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 22px;
  background: rgba(250, 253, 255, 0.96);
  box-shadow:
    0 24px 60px rgba(25, 45, 80, 0.22),
    0 4px 14px rgba(15, 78, 160, 0.12);
  backdrop-filter: blur(14px);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #0969f0, #1555de 55%, #0aa782);
  color: #fff;
}

.assistant-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.assistant-avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45);
  font-size: 25px;
}

.assistant-title {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.15;
}

.assistant-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #54ffb5;
  box-shadow: 0 0 0 4px rgba(84, 255, 181, 0.18);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-actions :deep(.q-btn) {
  color: #fff;
}

.assistant-messages {
  flex: 1;
  min-height: 260px;
  max-height: 390px;
  overflow-y: auto;
  scrollbar-color: rgba(44, 92, 130, 0.32) transparent;
  scrollbar-width: thin;
  padding: 18px 16px 10px;
  background:
    linear-gradient(180deg, rgba(225, 246, 255, 0.82), rgba(247, 252, 248, 0.9)),
    repeating-linear-gradient(135deg, rgba(8, 93, 190, 0.04) 0 1px, transparent 1px 12px);
}

.assistant-row {
  display: flex;
  margin-bottom: 12px;
}

.assistant-row.assistant {
  justify-content: flex-start;
}

.assistant-row.user {
  justify-content: flex-end;
}

.assistant-bubble {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 16px;
  color: #223041;
  background: #fff;
  border: 1px solid rgba(42, 84, 125, 0.08);
  box-shadow: 0 8px 18px rgba(20, 55, 90, 0.08);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.assistant-bubble.with-table {
  max-width: 100%;
}

.assistant-row.user .assistant-bubble {
  color: #fff;
  background: #1464f6;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(20, 100, 246, 0.2);
}

.assistant-bubble.thinking {
  color: #526273;
}

.assistant-text {
  white-space: pre-wrap;
  line-height: 1.52;
  font-size: 14px;
}

.stock-table-wrap {
  margin-top: 10px;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-color: rgba(44, 92, 130, 0.32) transparent;
  scrollbar-width: thin;
  border: 1px solid #d8e3ea;
  border-radius: 12px;
  background: #fff;
}

.stock-table {
  width: 100%;
  min-width: 610px;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: normal;
  word-break: normal;
}

.stock-table th,
.stock-table td {
  padding: 8px 9px;
  border-bottom: 1px solid #e8eef2;
  vertical-align: top;
}

.stock-table th {
  background: #f4f8fa;
  color: #596979;
  font-size: 11px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.stock-table tbody tr:last-child td {
  border-bottom: 0;
}

.number-cell {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.quick-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-color: rgba(44, 92, 130, 0.28) transparent;
  scrollbar-width: thin;
  padding: 10px 14px 2px;
  background: rgba(250, 253, 255, 0.96);
}

.quick-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d8e2e9;
  border-radius: 999px;
  color: #263442;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(35, 55, 75, 0.06);
}

.quick-chip:hover {
  border-color: #7ab8ff;
  color: #075bd8;
}

.quick-chip:disabled {
  cursor: default;
  opacity: 0.58;
}

.assistant-composer {
  display: block;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  box-sizing: border-box;
  padding: 12px 14px 16px;
  background: rgba(250, 253, 255, 0.96);
  border-top: 1px solid #e5edf2;
}

.composer-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 56px;
  box-sizing: border-box;
  padding: 4px 4px 4px 12px;
  border-radius: 28px;
  background: #fff;
  box-shadow:
    inset 0 0 0 1px #d6e4ec,
    0 8px 18px rgba(29, 68, 104, 0.08);
}

.composer-shell:focus-within {
  box-shadow:
    inset 0 0 0 2px rgba(20, 100, 246, 0.32),
    0 10px 22px rgba(29, 68, 104, 0.1);
}

.composer-input {
  display: block;
  min-width: 0;
  width: 100%;
  max-width: none;
}

.composer-input.q-field,
.composer-input :deep(.q-field__inner),
.composer-input :deep(.q-field__control-container) {
  width: 100%;
  min-width: 0;
}

.composer-input :deep(.q-field__control) {
  width: 100%;
  min-height: 44px;
  padding: 0;
  border-radius: 22px;
  background: transparent;
}

.composer-input :deep(.q-field__prepend) {
  height: 44px;
  padding-right: 8px;
  color: #517085;
}

.composer-input :deep(.q-field__native),
.composer-input :deep(textarea) {
  width: 100%;
  min-height: 44px;
  padding-top: 11px;
  padding-bottom: 9px;
  resize: none;
}

.composer-input :deep(textarea) {
  max-height: 90px;
  line-height: 1.45;
}

.send-button-cell {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  max-width: 48px;
  max-height: 48px;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  align-self: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.send-button-cell :deep(.q-btn) {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  max-width: 48px;
  max-height: 48px;
  padding: 0;
  border-radius: 50%;
  box-shadow: 0 8px 16px rgba(20, 100, 246, 0.18);
}

.send-button-cell:active {
  transform: scale(0.96);
}

.send-button-cell:active :deep(.q-btn) {
  box-shadow: 0 5px 12px rgba(20, 100, 246, 0.14);
}

.send-button-cell :deep(.q-btn__content) {
  width: 48px;
  height: 48px;
  min-height: 48px;
}

.send-button-cell :deep(.q-icon) {
  font-size: 20px;
}

.assistant-messages::-webkit-scrollbar,
.stock-table-wrap::-webkit-scrollbar,
.quick-row::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.assistant-messages::-webkit-scrollbar-track,
.stock-table-wrap::-webkit-scrollbar-track,
.quick-row::-webkit-scrollbar-track {
  background: transparent;
}

.assistant-messages::-webkit-scrollbar-thumb,
.stock-table-wrap::-webkit-scrollbar-thumb,
.quick-row::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(44, 92, 130, 0.28);
}

.assistant-messages::-webkit-scrollbar-thumb:hover,
.stock-table-wrap::-webkit-scrollbar-thumb:hover,
.quick-row::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 92, 130, 0.42);
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
  border-radius: 50%;
  background: currentcolor;
  opacity: 0.36;
  animation: thinking-pulse 1s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.16s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.32s; }

.assistant-window-enter-active,
.assistant-window-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.assistant-window-enter-from,
.assistant-window-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@keyframes ai-halo-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes thinking-pulse {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.36;
  }

  40% {
    transform: translateY(-3px);
    opacity: 0.9;
  }
}

@media (max-width: 599px) {
  .floating-chat-assistant {
    right: 12px;
    bottom: 12px;
  }

  .assistant-window {
    right: -2px;
    bottom: 58px;
    width: calc(100vw - 24px);
    max-height: calc(100vh - 104px);
    border-radius: 18px;
  }

  .assistant-messages {
    max-height: calc(100vh - 320px);
  }
}
</style>

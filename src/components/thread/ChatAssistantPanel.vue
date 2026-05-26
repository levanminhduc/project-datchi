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
          class="messages column q-gutter-md"
        >
          <div
            v-for="item in messages"
            :key="item.id"
            class="row"
            :class="item.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="message-bubble"
              :class="item.role"
            >
              <div class="message-text">
                {{ item.text }}
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

interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
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

function scrollToBottom() {
  void nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function sendMessage() {
  const message = draft.value.trim()
  if (!message || loading.value) return

  messages.value.push({ id: nextId++, role: 'user', text: message })
  draft.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const result = await chatAssistantService.query(message)
    messages.value.push({ id: nextId++, role: 'assistant', text: result.answer })
  } catch (error) {
    const text = error instanceof Error ? error.message : 'Lỗi khi tra cứu'
    messages.value.push({ id: nextId++, role: 'assistant', text })
  } finally {
    loading.value = false
    scrollToBottom()
  }
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
</script>

<style scoped lang="scss">
.chat-panel { overflow: hidden; }

.messages {
  height: min(62vh, 620px);
  min-height: 360px;
  overflow-y: auto;
  padding: 18px;
  background: linear-gradient(180deg, rgba(0, 121, 107, 0.07), rgba(25, 118, 210, 0.04));
}

.message-bubble {
  max-width: min(720px, 88%);
  border-radius: 8px;
  padding: 12px 14px;
  white-space: pre-line;
}

.message-bubble.assistant {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.message-bubble.user {
  background: var(--q-primary);
  color: white;
}

.message-text { line-height: 1.55; }
</style>

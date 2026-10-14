<template>
  <div
    ref="scrollEl"
    class="chat-message-list"
    :class="{ 'is-compact': compact }"
    role="log"
    aria-live="polite"
    aria-relevant="additions text"
    aria-label="Hội thoại với trợ lý tra cứu chỉ"
  >
    <ol class="chat-message-list__items">
      <li
        v-for="(item, index) in messages"
        :key="item.id"
        class="chat-message"
        :class="[item.role, { 'is-latest': index === messages.length - 1 }]"
      >
        <p
          v-if="item.role === 'user'"
          class="chat-user-bubble"
        >
          {{ item.text }}
        </p>

        <div
          v-else-if="item.status === 'thinking'"
          class="chat-thinking"
        >
          <span>Đang tra cứu</span>
          <span
            v-if="reducedMotion"
            aria-hidden="true"
          >…</span>
          <q-spinner-dots
            v-else
            size="1.4em"
            aria-hidden="true"
          />
        </div>

        <div
          v-else-if="item.status === 'error'"
          class="chat-error"
        >
          <p class="chat-error__title">
            Trợ lý chưa trả lời được
          </p>
          <p class="chat-error__reason">
            {{ item.text }}
          </p>
          <AppButton
            label="Thử lại"
            icon="refresh"
            variant="outlined"
            size="sm"
            :disable="busy"
            @click="emit('retry', item.id)"
          />
        </div>

        <div
          v-else
          class="chat-answer"
        >
          <ChatAnswerContent
            :message="item"
            :compact="compact"
          />
          <div class="chat-actions">
            <AppButton
              icon="content_copy"
              variant="text"
              size="sm"
              round
              dense
              aria-label="Sao chép câu trả lời"
              @click="copyAnswer(item.text)"
            >
              <q-tooltip>Sao chép</q-tooltip>
            </AppButton>
            <span class="chat-actions__meta">{{ describeMeta(item) }}</span>
          </div>
        </div>
      </li>
    </ol>

    <div class="chat-message-list__tail">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ChatMessage } from '@/components/thread/chat-assistant-messages'
import ChatAnswerContent from './ChatAnswerContent.vue'

const props = withDefaults(
  defineProps<{
    messages: ChatMessage[]
    compact?: boolean
  }>(),
  { compact: false },
)

const emit = defineEmits<{
  retry: [id: number]
}>()

const snackbar = useSnackbar()
const scrollEl = ref<HTMLElement | null>(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const busy = computed(() => props.messages.some((item) => item.status === 'thinking'))

function scrollToBottom() {
  const el = scrollEl.value
  if (el) el.scrollTop = el.scrollHeight
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function describeMeta(item: ChatMessage): string {
  const time = formatTime(item.createdAt)
  if (!item.sources?.length) return time
  return `Nguồn: ${item.sources.join(', ')} · ${time}`
}

async function copyAnswer(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    snackbar.success('Đã sao chép')
  } catch {
    snackbar.error('Không thể sao chép')
  }
}

watch(
  () => {
    const last = props.messages[props.messages.length - 1]
    return `${props.messages.length}:${last?.status ?? ''}`
  },
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

onMounted(scrollToBottom)
</script>

<style scoped lang="scss">
.chat-message-list {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;

  &.is-compact {
    padding: 12px;
  }

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
}

.chat-message-list__items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chat-message-list__tail {
  margin-top: 16px;

  &:empty {
    display: none;
  }
}

.chat-message {
  min-width: 0;

  @media (prefers-reduced-motion: no-preference) {
    animation: chat-message-in 0.18s ease-out;
  }

  &.user {
    display: flex;
    justify-content: flex-end;
  }
}

@keyframes chat-message-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.chat-user-bubble {
  width: fit-content;
  max-width: 80%;
  margin: 0;
  padding: 8px 14px;
  border-radius: 18px;
  background: var(--chat-user-bg);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chat-thinking {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--chat-muted);
}

.chat-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: 60ch;
}

.chat-error__title {
  margin: 0;
  color: var(--q-negative);
  font-size: 14px;
  font-weight: 600;
}

.chat-error__reason {
  margin: 0 0 8px;
  color: var(--chat-muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.chat-answer {
  min-width: 0;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  margin: 6px 0 0 -6px;
  opacity: 0;
  transition: opacity 0.15s;

  .chat-message.is-latest &,
  .chat-message:hover &,
  .chat-message:focus-within & {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.chat-actions :deep(.q-btn) {
  color: var(--chat-muted);
}

.chat-actions__meta {
  color: var(--chat-muted);
  font-size: 12px;
}
</style>

<template>
  <div
    ref="scrollEl"
    class="chat-message-list"
    :class="{ 'is-compact': compact }"
    role="log"
    aria-live="polite"
    aria-relevant="additions text"
    :aria-busy="busy"
    aria-label="Hội thoại với trợ lý tra cứu chỉ"
    @scroll.passive="onScroll"
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
          <span
            class="chat-thinking__dots"
            aria-hidden="true"
          >
            <i /><i /><i />
          </span>
          <span>{{ item.statusText ?? 'Đang tra cứu…' }}</span>
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
          <div
            v-if="item.status === 'done'"
            class="chat-actions"
          >
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
const FOLLOW_THRESHOLD_PX = 80
let following = true
let lastScrollTop = 0

const busy = computed(() => props.messages.some((item) => item.status === 'thinking' || item.status === 'streaming'))

function scrollToBottom(behavior: 'auto' | 'instant' | 'smooth' = 'auto') {
  const el = scrollEl.value
  if (el) el.scrollTo({ top: el.scrollHeight, behavior })
}

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD_PX
  if (nearBottom) following = true
  else if (el.scrollTop < lastScrollTop) following = false
  lastScrollTop = el.scrollTop
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
  () => props.messages.length,
  async () => {
    following = true
    await nextTick()
    scrollToBottom()
  },
)

watch(
  () => {
    const last = props.messages[props.messages.length - 1]
    return `${last?.status ?? ''}:${last?.text.length ?? 0}`
  },
  async () => {
    if (!following) return
    await nextTick()
    scrollToBottom('instant')
  },
)

onMounted(() => scrollToBottom())
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
  gap: 8px;
  color: var(--chat-muted);
}

.chat-thinking__dots {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: chat-thinking-dot 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    i,
    i:nth-child(n) {
      animation: chat-thinking-pulse 2s ease-in-out infinite;
      animation-delay: 0s;
    }
  }
}

@keyframes chat-thinking-dot {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes chat-thinking-pulse {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
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

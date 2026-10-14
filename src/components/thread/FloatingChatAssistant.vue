<template>
  <div
    class="floating-chat-assistant chat-assistant"
    :class="{ open: isOpen, dragging: isDragging, 'sheet-open': isOpen && isSheet }"
    :style="wrapperStyle"
  >
    <transition name="assistant-window">
      <section
        v-if="isOpen"
        class="assistant-window"
        :class="{ sheet: isSheet }"
        :style="windowStyle"
        role="dialog"
        aria-label="Trợ lý Chỉ AI"
      >
        <header class="assistant-header">
          <div class="assistant-title">
            Chỉ AI
          </div>

          <div class="header-actions">
            <AppButton
              icon="open_in_full"
              variant="text"
              round
              dense
              size="sm"
              aria-label="Mở trang đầy đủ"
              @click="openFullAssistant"
            >
              <q-tooltip>Mở trang đầy đủ</q-tooltip>
            </AppButton>
            <AppButton
              icon="add_comment"
              variant="text"
              round
              dense
              size="sm"
              aria-label="Cuộc trò chuyện mới"
              @click="startNewConversation"
            >
              <q-tooltip>Cuộc trò chuyện mới</q-tooltip>
            </AppButton>
            <AppButton
              icon="close"
              variant="text"
              round
              dense
              size="sm"
              aria-label="Đóng"
              @click="closeAssistant"
            >
              <q-tooltip>Đóng</q-tooltip>
            </AppButton>
          </div>
        </header>

        <ChatConversation
          ref="conversationRef"
          class="assistant-body"
          compact
        />
      </section>
    </transition>

    <button
      ref="launcherEl"
      class="assistant-launcher"
      type="button"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? 'Đóng trợ lý Chỉ AI' : 'Mở trợ lý Chỉ AI. Kéo để di chuyển'"
      @pointerdown="onLauncherPointerDown"
      @click="onLauncherClick"
    >
      <q-icon
        :name="isOpen ? 'close' : 'smart_toy'"
        size="24px"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import ChatConversation from '@/components/thread/chat/ChatConversation.vue'
import { useChatAssistant } from '@/composables/thread/use-chat-assistant'
import { useChatLauncherDock } from '@/composables/thread/use-chat-launcher-dock'

const router = useRouter()
const { reset } = useChatAssistant()
const {
  isDragging,
  isSheet,
  wrapperStyle,
  windowStyle,
  onLauncherPointerDown,
  consumeSuppressedClick,
} = useChatLauncherDock()

const isOpen = ref(false)
const launcherEl = ref<HTMLElement | null>(null)
const conversationRef = ref<InstanceType<typeof ChatConversation> | null>(null)

function toggleAssistant() {
  isOpen.value = !isOpen.value
}

function closeAssistant() {
  isOpen.value = false
}

function onLauncherClick() {
  if (consumeSuppressedClick()) return
  toggleAssistant()
}

function openFullAssistant() {
  isOpen.value = false
  void router.push('/thread/chat-assistant')
}

function startNewConversation() {
  reset()
  conversationRef.value?.focusComposer()
}

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  isOpen.value = false
}

watch(isOpen, async (open) => {
  if (open) {
    window.addEventListener('keydown', onWindowKeydown)
  } else {
    window.removeEventListener('keydown', onWindowKeydown)
  }

  await nextTick()

  if (open) {
    conversationRef.value?.focusComposer()
  } else {
    launcherEl.value?.focus()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<style scoped lang="scss">
.floating-chat-assistant {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3200;
  pointer-events: none;
  transition: left 0.24s ease, top 0.24s ease;
}

.floating-chat-assistant.dragging {
  transition: none;
  user-select: none;
}

.assistant-launcher,
.assistant-window {
  pointer-events: auto;
}

.assistant-launcher {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  cursor: grab;
  touch-action: none;
  color: #fff;
  background: var(--q-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
}

.floating-chat-assistant.dragging .assistant-launcher {
  cursor: grabbing;
}

.floating-chat-assistant.sheet-open .assistant-launcher {
  visibility: hidden;
}

.assistant-launcher:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 3px;
}

.assistant-window {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100vw - 24px));
  height: 600px;
  overflow: hidden;
  color: inherit;
  background: var(--chat-surface);
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.assistant-window.sheet {
  position: fixed;
  inset: 0;
  width: auto;
  height: 100dvh;
  max-height: none;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.assistant-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  border-bottom: 1px solid var(--chat-border);
}

.assistant-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.header-actions {
  display: flex;
  gap: 2px;
}

.assistant-body {
  flex: 1 1 auto;
  min-height: 0;
}

.assistant-window-enter-active,
.assistant-window-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.assistant-window-enter-from,
.assistant-window-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .floating-chat-assistant,
  .assistant-window-enter-active,
  .assistant-window-leave-active {
    transition: none;
  }

  .assistant-window-enter-from,
  .assistant-window-leave-to {
    transform: none;
  }
}
</style>

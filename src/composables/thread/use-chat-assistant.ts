import { computed, effectScope, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { chatAssistantService } from '@/services'
import { StreamUnavailableError, type StreamStatus } from '@/services/chat-stream'
import {
  toAssistantMessage,
  type ChatMessage,
} from '@/components/thread/chat-assistant-messages'
import { statusText } from '@/components/thread/chat-tool-labels'
import type { ChatAssistantResult, ChatHistoryItem } from '@/types/thread'
import { buildChatHistory } from './chat-history'

const FALLBACK_ERROR = 'Không thể kết nối tới trợ lý. Vui lòng thử lại.'
const MAX_FOLLOWUP_QUESTIONS = 2

const messages = ref<ChatMessage[]>([])
const loading = computed(() =>
  messages.value.some((item) => item.status === 'thinking' || item.status === 'streaming'),
)
const lastSuggestions = computed<string[]>(() => {
  const last = messages.value[messages.value.length - 1]
  if (!last || last.role !== 'assistant' || last.status !== 'done') return []
  return last.suggestions ?? []
})
const showFollowups = computed(() =>
  lastSuggestions.value.length > 0
  && messages.value.filter((item) => item.role === 'user').length <= MAX_FOLLOWUP_QUESTIONS,
)

let nextId = 1
let generation = 0
let logoutWatcherInstalled = false

function installLogoutWatcher() {
  if (logoutWatcherInstalled) return
  logoutWatcherInstalled = true

  const { isAuthenticated } = useAuth()
  effectScope(true).run(() => {
    watch(isAuthenticated, (value) => {
      if (!value) reset()
    })
  })
}

function reset() {
  generation += 1
  messages.value = []
}

function replaceMessage(id: number, next: ChatMessage) {
  const index = messages.value.findIndex((item) => item.id === id)
  if (index === -1) return
  messages.value.splice(index, 1, next)
}

function patchMessage(id: number, patch: (current: ChatMessage) => ChatMessage) {
  const index = messages.value.findIndex((item) => item.id === id)
  const current = messages.value[index]
  if (!current) return
  messages.value.splice(index, 1, patch(current))
}

function applyStatus(current: ChatMessage, status: StreamStatus): ChatMessage {
  if (status.phase === 'thinking' && current.status === 'streaming') return current
  const next = { ...current, statusText: statusText(status) }
  return status.phase === 'thinking' ? next : { ...next, status: 'thinking', text: '' }
}

function fetchAnswer(
  assistantId: number,
  question: string,
  history: ChatHistoryItem[],
  requestGeneration: number,
): Promise<ChatAssistantResult> {
  const isCurrent = () => requestGeneration === generation
  return chatAssistantService
    .stream(question, history, {
      onStatus: (status) => {
        if (isCurrent()) patchMessage(assistantId, (current) => applyStatus(current, status))
      },
      onDelta: (text) => {
        if (!isCurrent()) return
        patchMessage(assistantId, (current) => ({
          ...current,
          status: 'streaming',
          text: current.text + text,
        }))
      },
    })
    .catch((error: unknown) => {
      if (error instanceof StreamUnavailableError) return chatAssistantService.query(question, history)
      throw error
    })
}

async function resolveQuestion(assistantId: number, question: string, history: ChatHistoryItem[]) {
  const requestGeneration = generation

  try {
    const result = await fetchAnswer(assistantId, question, history, requestGeneration)
    if (requestGeneration !== generation) return
    replaceMessage(assistantId, {
      id: assistantId,
      role: 'assistant',
      status: 'done',
      createdAt: Date.now(),
      question,
      ...toAssistantMessage(result),
    })
  } catch (error) {
    if (requestGeneration !== generation) return
    replaceMessage(assistantId, {
      id: assistantId,
      role: 'assistant',
      status: 'error',
      text: error instanceof Error && error.message ? error.message : FALLBACK_ERROR,
      createdAt: Date.now(),
      question,
    })
  }
}

async function send(text: string) {
  const question = text.trim()
  if (!question || loading.value) return

  const history = buildChatHistory(messages.value, messages.value.length)
  const now = Date.now()
  const assistantId = nextId + 1
  messages.value.push(
    { id: nextId, role: 'user', text: question, status: 'done', createdAt: now },
    {
      id: assistantId,
      role: 'assistant',
      text: '',
      status: 'thinking',
      statusText: statusText({ phase: 'thinking' }),
      createdAt: now,
      question,
    },
  )
  nextId += 2

  await resolveQuestion(assistantId, question, history)
}

async function retry(id: number) {
  const index = messages.value.findIndex((item) => item.id === id)
  const target = messages.value[index]
  if (!target || target.status !== 'error' || !target.question || loading.value) return

  const question = target.question
  const history = buildChatHistory(messages.value, index - 1)
  replaceMessage(id, {
    id,
    role: 'assistant',
    text: '',
    status: 'thinking',
    statusText: statusText({ phase: 'thinking' }),
    createdAt: Date.now(),
    question,
  })

  await resolveQuestion(id, question, history)
}

export function useChatAssistant() {
  installLogoutWatcher()

  return {
    messages,
    loading,
    lastSuggestions,
    showFollowups,
    send,
    retry,
    reset,
  }
}

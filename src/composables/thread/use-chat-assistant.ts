import { computed, effectScope, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { chatAssistantService } from '@/services'
import {
  toAssistantMessage,
  type ChatMessage,
} from '@/components/thread/chat-assistant-messages'

const FALLBACK_ERROR = 'Không thể kết nối tới trợ lý. Vui lòng thử lại.'

const messages = ref<ChatMessage[]>([])
const loading = computed(() => messages.value.some((item) => item.status === 'thinking'))
const lastSuggestions = computed<string[]>(() => {
  const last = messages.value[messages.value.length - 1]
  if (!last || last.role !== 'assistant' || last.status !== 'done') return []
  return last.suggestions ?? []
})

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

async function resolveQuestion(assistantId: number, question: string) {
  const requestGeneration = generation

  try {
    const result = await chatAssistantService.query(question)
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

  const now = Date.now()
  const assistantId = nextId + 1
  messages.value.push(
    { id: nextId, role: 'user', text: question, status: 'done', createdAt: now },
    { id: assistantId, role: 'assistant', text: '', status: 'thinking', createdAt: now, question },
  )
  nextId += 2

  await resolveQuestion(assistantId, question)
}

async function retry(id: number) {
  const target = messages.value.find((item) => item.id === id)
  if (!target || target.status !== 'error' || !target.question || loading.value) return

  const question = target.question
  replaceMessage(id, {
    id,
    role: 'assistant',
    text: '',
    status: 'thinking',
    createdAt: Date.now(),
    question,
  })

  await resolveQuestion(id, question)
}

export function useChatAssistant() {
  installLogoutWatcher()

  return {
    messages,
    loading,
    lastSuggestions,
    send,
    retry,
    reset,
  }
}

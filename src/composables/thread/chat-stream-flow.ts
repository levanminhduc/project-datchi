import type { ChatMessage } from '../../components/thread/chat-assistant-messages'
import { statusText } from '../../components/thread/chat-tool-labels'
import { StreamUnavailableError, type StreamHandlers, type StreamStatus } from '../../services/chat-stream'
import type { ChatAssistantResult, ChatHistoryItem } from '../../types/thread/chat-assistant'

export interface AnswerService {
  stream(
    message: string,
    history: ChatHistoryItem[],
    handlers: StreamHandlers,
    signal?: AbortSignal,
  ): Promise<ChatAssistantResult>
  query(message: string, history: ChatHistoryItem[], signal?: AbortSignal): Promise<ChatAssistantResult>
}

export function applyStatus(current: ChatMessage, status: StreamStatus): ChatMessage {
  if (status.phase === 'thinking' && current.status === 'streaming') return current
  const next = { ...current, statusText: statusText(status) }
  return status.phase === 'thinking' ? next : { ...next, status: 'thinking', text: '' }
}

export function appendDelta(current: ChatMessage, text: string): ChatMessage {
  return { ...current, status: 'streaming', text: current.text + text }
}

export function fetchAnswer(
  service: AnswerService,
  question: string,
  history: ChatHistoryItem[],
  signal: AbortSignal,
  isCurrent: () => boolean,
  update: (patch: (current: ChatMessage) => ChatMessage) => void,
): Promise<ChatAssistantResult> {
  return service
    .stream(question, history, {
      onStatus: (status) => {
        if (isCurrent()) update((current) => applyStatus(current, status))
      },
      onDelta: (text) => {
        if (isCurrent()) update((current) => appendDelta(current, text))
      },
    }, signal)
    .catch((error: unknown) => {
      if (error instanceof StreamUnavailableError && isCurrent()) return service.query(question, history, signal)
      throw error
    })
}

export function createRequestTracker() {
  let active: AbortController | null = null
  return {
    begin(): AbortController {
      active = new AbortController()
      return active
    },
    end(controller: AbortController) {
      if (active === controller) active = null
    },
    abort() {
      active?.abort()
      active = null
    },
  }
}

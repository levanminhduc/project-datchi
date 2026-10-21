import assert from 'node:assert/strict'
import type { ChatMessage } from '../../../components/thread/chat-assistant-messages'
import { StreamUnavailableError, type StreamHandlers } from '../../../services/chat-stream'
import type { ChatAssistantResult } from '../../../types/thread/chat-assistant'
import {
  appendDelta,
  applyStatus,
  createRequestTracker,
  fetchAnswer,
  type AnswerService,
} from '../chat-stream-flow'

const RESULT = { answer: 'Còn 120.' } as ChatAssistantResult

function pending(): ChatMessage {
  return { id: 2, role: 'assistant', text: '', status: 'thinking', statusText: 'Đang đọc câu hỏi…', createdAt: 0 }
}

function testApplyStatusThinkingKeepsText() {
  const streaming: ChatMessage = { ...pending(), status: 'streaming', text: 'Còn' }
  assert.equal(applyStatus(streaming, { phase: 'thinking' }), streaming)
  const thinking = applyStatus(pending(), { phase: 'thinking' })
  assert.equal(thinking.status, 'thinking')
  assert.equal(thinking.statusText, 'Đang đọc câu hỏi…')
}

function testToolAndRetryClearText() {
  const streaming: ChatMessage = { ...pending(), status: 'streaming', text: 'Để mình tra' }
  const afterTool = applyStatus(streaming, { phase: 'tool', tools: ['search_inventory'] })
  assert.deepEqual([afterTool.status, afterTool.text, afterTool.statusText], ['thinking', '', 'Đang tra tồn kho…'])
  const afterRetry = applyStatus({ ...streaming, text: 'dở dang' }, { phase: 'retry' })
  assert.deepEqual([afterRetry.status, afterRetry.text, afterRetry.statusText], ['thinking', '', 'Đang thử lại…'])
}

function testAppendDeltaStreams() {
  const first = appendDelta(pending(), 'Còn ')
  const second = appendDelta(first, '120')
  assert.deepEqual([second.status, second.text], ['streaming', 'Còn 120'])
}

interface Harness {
  message: ChatMessage
  calls: string[]
  signals: Array<AbortSignal | undefined>
  service: AnswerService
}

function harness(
  script: (handlers: StreamHandlers) => Promise<ChatAssistantResult>,
  queryResult: Promise<ChatAssistantResult> = Promise.resolve(RESULT),
): Harness {
  const state: Harness = {
    message: pending(),
    calls: [],
    signals: [],
    service: {
      stream: async (_message, _history, handlers, signal) => {
        state.calls.push('stream')
        state.signals.push(signal)
        return script(handlers)
      },
      query: async (_message, _history, signal) => {
        state.calls.push('query')
        state.signals.push(signal)
        return queryResult
      },
    },
  }
  return state
}

async function run(state: Harness, isCurrent: () => boolean = () => true) {
  const controller = new AbortController()
  const result = await fetchAnswer(state.service, 'q', [], controller.signal, isCurrent, (patch) => {
    state.message = patch(state.message)
  })
  return { result, signal: controller.signal }
}

async function testStreamsStatusAndTextThenReturnsResult() {
  const seen: string[] = []
  const state = harness(async (handlers) => {
    handlers.onStatus({ phase: 'thinking' })
    handlers.onDelta('Để mình tra')
    seen.push(state.message.text)
    handlers.onStatus({ phase: 'tool', tools: ['search_inventory'] })
    seen.push(state.message.text)
    handlers.onDelta('Còn 120')
    seen.push(state.message.text)
    return RESULT
  })
  const { result, signal } = await run(state)
  assert.equal(result, RESULT)
  assert.deepEqual(seen, ['Để mình tra', '', 'Còn 120'])
  assert.deepEqual(state.calls, ['stream'])
  assert.equal(state.signals[0], signal)
}

async function testStaleCallbacksAreDropped() {
  let current = true
  const state = harness(async (handlers) => {
    handlers.onDelta('Còn ')
    current = false
    handlers.onDelta('bị bỏ')
    handlers.onStatus({ phase: 'retry' })
    return RESULT
  })
  await run(state, () => current)
  assert.deepEqual([state.message.text, state.message.status], ['Còn ', 'streaming'])
}

async function testFallsBackToQueryWhenStreamUnavailable() {
  const state = harness(async () => {
    throw new StreamUnavailableError()
  })
  const { result, signal } = await run(state)
  assert.equal(result, RESULT)
  assert.deepEqual(state.calls, ['stream', 'query'])
  assert.equal(state.signals[1], signal)
}

async function testNoFallbackWhenStale() {
  const state = harness(async () => {
    throw new StreamUnavailableError()
  })
  await assert.rejects(run(state, () => false), StreamUnavailableError)
  assert.deepEqual(state.calls, ['stream'])
}

async function testOtherErrorsAreNotFallenBack() {
  const state = harness(async () => {
    throw new Error('Trợ lý phản hồi chậm')
  })
  await assert.rejects(run(state), { message: 'Trợ lý phản hồi chậm' })
  assert.deepEqual(state.calls, ['stream'])
}

function testRequestTrackerAbortsActiveRequest() {
  const tracker = createRequestTracker()
  const first = tracker.begin()
  tracker.end(first)
  tracker.abort()
  assert.equal(first.signal.aborted, false)

  const second = tracker.begin()
  tracker.abort()
  assert.equal(second.signal.aborted, true)

  const third = tracker.begin()
  tracker.end(second)
  tracker.abort()
  assert.equal(third.signal.aborted, true)
  tracker.abort()
}

async function main() {
  testApplyStatusThinkingKeepsText()
  testToolAndRetryClearText()
  testAppendDeltaStreams()
  await testStreamsStatusAndTextThenReturnsResult()
  await testStaleCallbacksAreDropped()
  await testFallsBackToQueryWhenStreamUnavailable()
  await testNoFallbackWhenStale()
  await testOtherErrorsAreNotFallenBack()
  testRequestTrackerAbortsActiveRequest()
  console.log('chat-stream-flow tests passed')
}

void main()

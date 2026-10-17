import assert from 'node:assert/strict'
import type { ChatMessage } from '../../../components/thread/chat-assistant-messages'
import { buildChatHistory } from '../chat-history'

let nextId = 1

function message(role: ChatMessage['role'], text: string, status: ChatMessage['status'] = 'done'): ChatMessage {
  nextId += 1
  return { id: nextId, role, text, status, createdAt: 0 }
}

function pair(
  question: string,
  answer: string,
  status: ChatMessage['status'] = 'done',
  answerKind?: ChatMessage['answerKind'],
): ChatMessage[] {
  const reply = message('assistant', answer, status)
  return [message('user', question), answerKind ? { ...reply, answerKind } : reply]
}

function testKeepsDonePairsOnly() {
  const messages = [
    ...pair('q1', 'a1'),
    ...pair('q2', 'Lỗi kết nối', 'error'),
    ...pair('q3', 'a3'),
    ...pair('q4', '', 'thinking'),
  ]
  assert.deepEqual(buildChatHistory(messages, messages.length), [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
    { role: 'user', content: 'q3' },
    { role: 'assistant', content: 'a3' },
  ])
}

function testSkipsEmptyAnswer() {
  const messages = [...pair('q1', '   '), ...pair('q2', 'a2')]
  assert.deepEqual(buildChatHistory(messages, messages.length), [
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'a2' },
  ])
}

function testKeepsLastTenPairs() {
  const messages = Array.from({ length: 12 }, (_, index) => pair(`q${index}`, `a${index}`)).flat()
  const history = buildChatHistory(messages, messages.length)
  assert.equal(history.length, 20)
  assert.deepEqual(history[0], { role: 'user', content: 'q2' })
  assert.deepEqual(history[19], { role: 'assistant', content: 'a11' })
}

function testTruncatesContent() {
  const messages = pair('q'.repeat(2500), 'a'.repeat(2500))
  const history = buildChatHistory(messages, messages.length)
  assert.equal(history[0]?.content.length, 2000)
  assert.equal(history[1]?.content.length, 2000)
}

function testCutsByCodePoint() {
  const messages = pair('q', 'a'.repeat(1999) + '📦' + 'b'.repeat(10))
  const history = buildChatHistory(messages, messages.length)
  assert.equal(history[1]?.content, 'a'.repeat(1999) + '📦')
}

function testBeforeIndexExcludesRetriedPair() {
  const messages = [...pair('q1', 'a1'), ...pair('q2', 'a2'), ...pair('q3', 'Lỗi', 'error')]
  assert.deepEqual(buildChatHistory(messages, 2), [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
  ])
  assert.deepEqual(buildChatHistory(messages, 0), [])
}

function testSkipsNonAnswerKinds() {
  const messages = [
    ...pair('q1', 'Trợ lý không trả lời được câu hỏi này.', 'done', 'refusal'),
    ...pair('q2', 'Trợ lý chưa tìm được câu trả lời.', 'done', 'empty'),
    ...pair('q3', 'Trợ lý chưa tra xong.', 'done', 'limit'),
    ...pair('q4', 'Bạn chưa được cấp quyền.', 'done', 'no_tools'),
    ...pair('q5', 'a5', 'done', 'answer'),
    ...pair('q6', 'a6'),
  ]
  assert.deepEqual(buildChatHistory(messages, messages.length), [
    { role: 'user', content: 'q5' },
    { role: 'assistant', content: 'a5' },
    { role: 'user', content: 'q6' },
    { role: 'assistant', content: 'a6' },
  ])
}

function testSkipsUnknownAnswerKind() {
  const messages = [
    ...pair('q1', 'Công cụ lỗi.', 'done', 'tool_error'),
    ...pair('q2', 'a2', 'done', 'answer'),
  ]
  assert.deepEqual(buildChatHistory(messages, messages.length), [
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'a2' },
  ])
}

function testErrorPairBeforeRetryPoint() {
  const messages = [...pair('q1', 'Lỗi', 'error'), ...pair('q2', 'a2'), ...pair('q3', 'Lỗi', 'error')]
  assert.deepEqual(buildChatHistory(messages, 4), [
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'a2' },
  ])
}

function testBeforeIndexBeyondLength() {
  const messages = pair('q1', 'a1')
  assert.deepEqual(buildChatHistory(messages, 99), [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
  ])
}

function testUnpairedUserMessageIsSkipped() {
  const messages = [message('user', 'q0'), ...pair('q1', 'a1')]
  assert.deepEqual(buildChatHistory(messages, messages.length), [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
  ])
}

function main() {
  testKeepsDonePairsOnly()
  testSkipsEmptyAnswer()
  testKeepsLastTenPairs()
  testTruncatesContent()
  testCutsByCodePoint()
  testBeforeIndexExcludesRetriedPair()
  testSkipsNonAnswerKinds()
  testSkipsUnknownAnswerKind()
  testErrorPairBeforeRetryPoint()
  testBeforeIndexBeyondLength()
  testUnpairedUserMessageIsSkipped()
  console.log('chat-history tests passed')
}

main()

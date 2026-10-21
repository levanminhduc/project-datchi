import assert from 'node:assert/strict'
import { toAssistantMessage } from '../../../components/thread/chat-assistant-messages'
import { TOOL_LABELS, statusText } from '../../../components/thread/chat-tool-labels'
import {
  handleStreamEvent,
  normalizeDone,
  parseSseChunks,
  type StreamHandlers,
  type StreamStatus,
} from '../../../services/chat-stream'

const ALL_TOOLS = [
  'search_inventory',
  'get_inventory_by_warehouse',
  'find_thread_usage',
  'get_style_thread_specs',
  'search_styles',
  'search_purchase_orders',
  'search_weekly_orders',
  'get_weekly_order',
  'get_weekly_order_threads',
  'get_dept_allocation',
  'search_issues',
  'get_issue_detail',
]

function testParsesEventSplitAcrossBuffers() {
  const first = parseSseChunks('event: delta\ndata: {"text":"Còn')
  assert.deepEqual(first.events, [])
  const second = parseSseChunks(`${first.rest} 120"}\n\n`)
  assert.deepEqual(second.events, [{ event: 'delta', data: '{"text":"Còn 120"}' }])
  assert.equal(second.rest, '')
}

function testParsesMultipleEventsAndKeepsRest() {
  const buffer = 'event: status\ndata: {"phase":"thinking"}\n\nevent: delta\ndata: {"text":"a"}\n\nevent: do'
  const parsed = parseSseChunks(buffer)
  assert.deepEqual(parsed.events.map((item) => item.event), ['status', 'delta'])
  assert.equal(parsed.rest, 'event: do')
}

function testSkipsPingComments() {
  const parsed = parseSseChunks(': ping\n\nevent: delta\ndata: {"text":"x"}\n\n: ping\n\n')
  assert.deepEqual(parsed.events, [{ event: 'delta', data: '{"text":"x"}' }])
  assert.equal(parsed.rest, '')
}

function testParsesCrLfAndJoinsDataLines() {
  const parsed = parseSseChunks('event: delta\r\ndata: a\r\ndata: b\r\n\r\n')
  assert.deepEqual(parsed.events, [{ event: 'delta', data: 'a\nb' }])
}

function testStatusTextExactStrings() {
  assert.equal(statusText({ phase: 'thinking' }), 'Đang đọc câu hỏi…')
  assert.equal(statusText({ phase: 'retry' }), 'Đang thử lại…')
  assert.equal(statusText({ phase: 'tool', tools: ['search_inventory'] }), 'Đang tra tồn kho…')
  assert.equal(statusText({ phase: 'tool', tools: ['made_up_tool'] }), 'Đang tra cứu dữ liệu…')
  assert.equal(statusText({ phase: 'tool', tools: [] }), 'Đang tra cứu dữ liệu…')
}

function testStatusTextSeveralTools() {
  assert.equal(
    statusText({ phase: 'tool', tools: ['search_styles', 'search_purchase_orders'] }),
    'Đang tìm mã hàng và vài nguồn khác…',
  )
  assert.equal(
    statusText({ phase: 'tool', tools: ['search_inventory', 'get_inventory_by_warehouse'] }),
    'Đang tra tồn kho…',
  )
}

function testToolLabelsCoverAllTools() {
  for (const name of ALL_TOOLS) {
    const label = TOOL_LABELS[name]
    assert.ok(label, name)
    assert.ok(label.source.trim(), `${name} source`)
    assert.ok(label.status.trim(), `${name} status`)
  }
  assert.equal(Object.keys(TOOL_LABELS).length, ALL_TOOLS.length)
}

function testSourcesComeFromToolLabels() {
  const message = toAssistantMessage(normalizeDone({
    answer: 'Còn 120 cuộn.',
    tools_used: ['search_inventory', 'get_inventory_by_warehouse', 'constructor', 'search_styles'],
  }))
  assert.deepEqual(message.sources, [TOOL_LABELS.search_inventory!.source, TOOL_LABELS.search_styles!.source])
}

function testNormalizeDoneEmptyAnswer() {
  const result = normalizeDone({ answer: '   ', answer_kind: 'answer', tools_used: ['search_inventory'], suggestions: [] })
  assert.equal(result.answer, 'Trợ lý không trả về câu trả lời.')
  assert.equal(result.answer_kind, 'empty')
  assert.deepEqual(result.context, { tools_used: ['search_inventory'] })
}

function testNormalizeDoneCapsAndTrimsSuggestions() {
  const result = normalizeDone({
    answer: 'Còn 120.',
    answer_kind: 'answer',
    tools_used: ['search_inventory', 5],
    suggestions: [' a ', '', 'b', 7, 'c', 'd'],
  })
  assert.equal(result.answer, 'Còn 120.')
  assert.equal(result.answer_kind, 'answer')
  assert.deepEqual(result.suggestions, ['a', 'b', 'c'])
  assert.deepEqual(result.context, { tools_used: ['search_inventory'] })
  assert.deepEqual([result.stock, result.usage, result.intents], [[], [], []])
}

function testNormalizeDoneWithoutKindOrBadInput() {
  assert.equal('answer_kind' in normalizeDone({ answer: 'ok' }), false)
  const empty = normalizeDone(null)
  assert.equal(empty.answer_kind, 'empty')
  assert.deepEqual(empty.suggestions, [])
}

function recorder() {
  const statuses: StreamStatus[] = []
  const deltas: string[] = []
  const handlers: StreamHandlers = {
    onStatus: (status) => statuses.push(status),
    onDelta: (text) => deltas.push(text),
  }
  return { statuses, deltas, handlers }
}

function testHandleStreamEventRoutesStatusAndDelta() {
  const { statuses, deltas, handlers } = recorder()
  assert.equal(handleStreamEvent({ event: 'status', data: '{"phase":"thinking"}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'status', data: '{"phase":"tool","tools":["search_inventory",1]}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'status', data: '{"phase":"retry"}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'status', data: '{"phase":"zzz"}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'delta', data: '{"text":"Còn "}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'delta', data: '{"text":""}' }, handlers), null)
  assert.equal(handleStreamEvent({ event: 'delta', data: 'không phải json' }, handlers), null)
  assert.deepEqual(statuses, [
    { phase: 'thinking' },
    { phase: 'tool', tools: ['search_inventory'] },
    { phase: 'retry' },
  ])
  assert.deepEqual(deltas, ['Còn '])
}

function testHandleStreamEventDoneReturnsNormalizedResult() {
  const { handlers } = recorder()
  const result = handleStreamEvent(
    { event: 'done', data: '{"answer":"Còn 120.","answer_kind":"answer","tools_used":["search_styles"],"suggestions":["x"]}' },
    handlers,
  )
  assert.equal(result?.answer, 'Còn 120.')
  assert.deepEqual(result?.suggestions, ['x'])
  assert.deepEqual(result?.context, { tools_used: ['search_styles'] })
}

function testHandleStreamEventErrorThrowsMessage() {
  const { handlers } = recorder()
  assert.throws(
    () => handleStreamEvent({ event: 'error', data: '{"code":"llm_timeout","message":"Trợ lý phản hồi chậm"}' }, handlers),
    { message: 'Trợ lý phản hồi chậm' },
  )
  assert.throws(
    () => handleStreamEvent({ event: 'error', data: 'hỏng' }, handlers),
    { message: 'Không thể kết nối tới trợ lý. Vui lòng thử lại.' },
  )
  assert.throws(
    () => handleStreamEvent({ event: 'done', data: 'hỏng' }, handlers),
    { message: 'Trợ lý trả về dữ liệu không hợp lệ' },
  )
}

function testHandleStreamEventIgnoresUnknown() {
  const { statuses, deltas, handlers } = recorder()
  assert.equal(handleStreamEvent({ event: 'message', data: 'x' }, handlers), null)
  assert.deepEqual([statuses, deltas], [[], []])
}

function main() {
  testParsesEventSplitAcrossBuffers()
  testParsesMultipleEventsAndKeepsRest()
  testSkipsPingComments()
  testParsesCrLfAndJoinsDataLines()
  testStatusTextExactStrings()
  testStatusTextSeveralTools()
  testToolLabelsCoverAllTools()
  testSourcesComeFromToolLabels()
  testNormalizeDoneEmptyAnswer()
  testNormalizeDoneCapsAndTrimsSuggestions()
  testNormalizeDoneWithoutKindOrBadInput()
  testHandleStreamEventRoutesStatusAndDelta()
  testHandleStreamEventDoneReturnsNormalizedResult()
  testHandleStreamEventErrorThrowsMessage()
  testHandleStreamEventIgnoresUnknown()
  console.log('chat-stream tests passed')
}

main()

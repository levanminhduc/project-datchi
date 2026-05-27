import assert from 'node:assert/strict'
import {
  buildApprovalCallbackData,
  buildWeeklyOrderApprovalMessages,
  parseApprovalCallbackData,
} from './weekly-order-approval-service'

function testMessageEscapingAndChunking() {
  const messages = buildWeeklyOrderApprovalMessages(
    {
      week: {
        id: 42,
        week_name: 'Tuần <A&B>',
        start_date: '2026-05-27',
        created_by: 'Nguyễn <script>',
      },
      summaries: Array.from({ length: 12 }, (_, index) => ({
        supplier_name: `NCC <${index}>`,
        tex_number: '40',
        thread_color: `C970${index} & đỏ`,
        total_final: index + 1,
      })),
      itemCount: 12,
      totalProductQuantity: 345,
    },
    550,
  )

  assert.ok(messages.length > 1, 'long detail should be split into multiple Telegram messages')
  assert.ok(messages.every((message) => message.length <= 550), 'each chunk stays under the requested limit')
  assert.match(messages[0], /Tuần &lt;A&amp;B&gt;/)
  assert.match(messages[0], /Nguyễn &lt;script&gt;/)
  assert.ok(messages.some((message) => message.includes('NCC &lt;11&gt;')))
}

function testCallbackDataParsing() {
  const requestId = '123e4567-e89b-42d3-a456-426614174000'
  const callbackData = buildApprovalCallbackData(requestId)

  assert.equal(callbackData.length < 64, true)
  assert.equal(parseApprovalCallbackData(callbackData), requestId)
  assert.equal(parseApprovalCallbackData('woa:approve:not-a-uuid'), null)
  assert.equal(parseApprovalCallbackData('other:123e4567-e89b-42d3-a456-426614174000'), null)
}

testMessageEscapingAndChunking()
testCallbackDataParsing()
console.log('weekly-order approval service tests passed')

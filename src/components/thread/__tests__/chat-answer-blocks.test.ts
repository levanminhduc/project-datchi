import assert from 'node:assert/strict'
import { parseAnswerBlocks } from '../chat-assistant-messages'

function testParsesTable() {
  const blocks = parseAnswerBlocks('Tồn theo kho:\n| Kho | Cuộn |\n| --- | ---: |\n| **A** | 12 |\n| B | 1.200 |')
  assert.equal(blocks.length, 2)
  const table = blocks[1]
  assert.ok(table && table.type === 'table')
  assert.deepEqual(table.headers, [[{ text: 'Kho', bold: false }], [{ text: 'Cuộn', bold: false }]])
  assert.deepEqual(table.rows[0], [[{ text: 'A', bold: true }], [{ text: '12', bold: false }]])
  assert.deepEqual(table.numeric, [false, true])
}

function testPadsAndTrimsCells() {
  const [table] = parseAnswerBlocks('| A | B |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |')
  assert.ok(table && table.type === 'table')
  assert.equal(table.rows[0]?.length, 2)
  assert.deepEqual(table.rows[0]?.[1], [])
  assert.equal(table.rows[1]?.length, 2)
}

function testPipeLinesWithoutSeparatorStayParagraph() {
  const blocks = parseAnswerBlocks('| Tex 40 | C9700 |\n| còn 12 |')
  assert.deepEqual(blocks.map((b) => b.type), ['paragraph'])
}

function testTextAfterTableIsParagraph() {
  const blocks = parseAnswerBlocks('| A |\n|---|\n| 1 |\nHết.')
  assert.deepEqual(blocks.map((b) => b.type), ['table', 'paragraph'])
}

function testListsStillParse() {
  assert.deepEqual(parseAnswerBlocks('- a\n- b').map((b) => b.type), ['list'])
}

function main() {
  testParsesTable()
  testPadsAndTrimsCells()
  testPipeLinesWithoutSeparatorStayParagraph()
  testTextAfterTableIsParagraph()
  testListsStillParse()
  console.log('chat-answer-blocks tests passed')
}

main()

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

const STREAMING = { streaming: true }

function testStreamingDropsRowWithoutClosingPipe() {
  const text = 'Tồn:\n| Kho | Cuộn |\n| --- | ---: |\n| A | 12 |\n| B | 1'
  const [, table] = parseAnswerBlocks(text, STREAMING)
  assert.ok(table && table.type === 'table')
  assert.equal(table.rows.length, 1)
  assert.deepEqual(table.rows[0], [[{ text: 'A', bold: false }], [{ text: '12', bold: false }]])

  const [, finished] = parseAnswerBlocks(text)
  assert.ok(finished && finished.type === 'table')
  assert.equal(finished.rows.length, 2)
}

function testStreamingTableWithOnlyPartialRowHasNoRows() {
  const [table] = parseAnswerBlocks('| Kho | Cuộn |\n| --- | ---: |\n| A | 1', STREAMING)
  assert.ok(table && table.type === 'table')
  assert.equal(table.rows.length, 0)
}

function testStreamingKeepsClosedLastRow() {
  const [table] = parseAnswerBlocks('| Kho | Cuộn |\n| --- | ---: |\n| A | 12 |', STREAMING)
  assert.ok(table && table.type === 'table')
  assert.equal(table.rows.length, 1)
}

function testStreamingHidesTableHeaderUntilSeparatorArrives() {
  for (const tail of ['| Kho | Cuộn |', '| Kho | Cuộn |\n|', '| Kho | Cuộn |\n| --', '| Kho | Cuộn |\n| --- | :-']) {
    const blocks = parseAnswerBlocks('Tồn theo kho:\n' + tail, STREAMING)
    assert.deepEqual(blocks.map((b) => b.type), ['paragraph'], tail)
    const [paragraph] = blocks
    assert.equal(paragraph?.type === 'paragraph' && paragraph.lines.length, 1, tail)
  }
  const kept = parseAnswerBlocks('Tồn theo kho:\n| Kho | Cuộn |')
  assert.equal(kept[0]?.type === 'paragraph' && kept[0].lines.length, 2)
}

function testStreamingPipeLineFollowedByTextStaysParagraph() {
  const blocks = parseAnswerBlocks('| Tex 40 | C9700 |\nCòn 12 cuộn', STREAMING)
  assert.deepEqual(blocks.map((b) => b.type), ['paragraph'])
  assert.equal(blocks[0]?.type === 'paragraph' && blocks[0].lines.length, 2)
}

function testUnclosedBoldIsPlainText() {
  const [streaming] = parseAnswerBlocks('Còn **12', STREAMING)
  assert.ok(streaming && streaming.type === 'paragraph')
  assert.deepEqual(streaming.lines[0], [{ text: 'Còn 12', bold: false }])

  const [trailingStar] = parseAnswerBlocks('Còn **12*', STREAMING)
  assert.ok(trailingStar && trailingStar.type === 'paragraph')
  assert.deepEqual(trailingStar.lines[0], [{ text: 'Còn 12', bold: false }])

  const [closed] = parseAnswerBlocks('Còn **12** cuộn', STREAMING)
  assert.ok(closed && closed.type === 'paragraph')
  assert.deepEqual(closed.lines[0], [
    { text: 'Còn ', bold: false },
    { text: '12', bold: true },
    { text: ' cuộn', bold: false },
  ])

  const [finished] = parseAnswerBlocks('Còn **12')
  assert.ok(finished && finished.type === 'paragraph')
  assert.deepEqual(finished.lines[0], [{ text: 'Còn **12', bold: false }])
}

function testStreamingEmptyAndSymbolOnlyInputDoNotCrash() {
  assert.deepEqual(parseAnswerBlocks('', STREAMING), [])
  assert.deepEqual(parseAnswerBlocks('**', STREAMING), [])
  assert.deepEqual(parseAnswerBlocks('|', STREAMING), [])
}

function main() {
  testParsesTable()
  testPadsAndTrimsCells()
  testPipeLinesWithoutSeparatorStayParagraph()
  testTextAfterTableIsParagraph()
  testListsStillParse()
  testStreamingDropsRowWithoutClosingPipe()
  testStreamingTableWithOnlyPartialRowHasNoRows()
  testStreamingKeepsClosedLastRow()
  testStreamingHidesTableHeaderUntilSeparatorArrives()
  testStreamingPipeLineFollowedByTextStaysParagraph()
  testUnclosedBoldIsPlainText()
  testStreamingEmptyAndSymbolOnlyInputDoNotCrash()
  console.log('chat-answer-blocks tests passed')
}

main()

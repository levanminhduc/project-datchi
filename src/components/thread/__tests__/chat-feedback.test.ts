import assert from 'node:assert/strict'
import {
  canRate,
  editComment,
  feedbackFailed,
  feedbackSent,
  FEEDBACK_COMMENT_MAX,
  initialFeedback,
  pickRating,
  skipComment,
  submitComment,
  toFeedbackRequest,
  type FeedbackState,
} from '../chat-feedback'

const RATABLE = { status: 'done', answerKind: 'answer', requestId: 'req-1' } as const

function testOnlyDoneAnswersWithRequestIdCanBeRated() {
  assert.equal(canRate(RATABLE), true)
  assert.equal(canRate({ ...RATABLE, status: 'streaming' }), false)
  assert.equal(canRate({ ...RATABLE, status: 'thinking' }), false)
  assert.equal(canRate({ ...RATABLE, status: 'error' }), false)
  assert.equal(canRate({ ...RATABLE, answerKind: 'refusal' }), false)
  assert.equal(canRate({ ...RATABLE, answerKind: 'empty' }), false)
  assert.equal(canRate({ ...RATABLE, answerKind: undefined }), false)
  assert.equal(canRate({ ...RATABLE, requestId: undefined }), false)
  assert.equal(canRate({ ...RATABLE, requestId: '' }), false)
}

function testThumbsUpSendsImmediately() {
  const state = pickRating(initialFeedback(), 'up')
  assert.deepEqual(state, { phase: 'sending', rating: 'up', comment: '' })
}

function testThumbsDownOpensCommentFirst() {
  const state = pickRating(initialFeedback(), 'down')
  assert.deepEqual(state, { phase: 'comment', rating: 'down', comment: '' })
}

function testPickingAgainIsIgnoredOnceStarted() {
  for (const phase of ['sending', 'sent'] as const) {
    const locked: FeedbackState = { phase, rating: 'up', comment: '' }
    assert.equal(pickRating(locked, 'down'), locked)
  }
  const commenting = pickRating(initialFeedback(), 'down')
  assert.equal(pickRating(commenting, 'up'), commenting)
}

function testEditCommentCutsByCodePointOnlyWhileCommenting() {
  const commenting = pickRating(initialFeedback(), 'down')
  assert.equal(editComment(commenting, 'Sai số cuộn').comment, 'Sai số cuộn')
  const long = editComment(commenting, '😀'.repeat(FEEDBACK_COMMENT_MAX + 20)).comment
  assert.equal(Array.from(long).length, FEEDBACK_COMMENT_MAX)
  const idle = initialFeedback()
  assert.equal(editComment(idle, 'abc'), idle)
}

function testSubmitAndSkipMoveToSending() {
  const typed = editComment(pickRating(initialFeedback(), 'down'), '  Sai kho  ')
  assert.deepEqual(submitComment(typed), { phase: 'sending', rating: 'down', comment: 'Sai kho' })
  assert.deepEqual(skipComment(typed), { phase: 'sending', rating: 'down', comment: '' })
  const idle = initialFeedback()
  assert.equal(submitComment(idle), idle)
  assert.equal(skipComment(idle), idle)
}

function testSentLocksAndFailureAllowsRetry() {
  const up = pickRating(initialFeedback(), 'up')
  assert.deepEqual(feedbackSent(up), { phase: 'sent', rating: 'up', comment: '' })
  assert.deepEqual(feedbackFailed(up), initialFeedback())

  const down = submitComment(editComment(pickRating(initialFeedback(), 'down'), 'Sai kho'))
  assert.deepEqual(feedbackFailed(down), { phase: 'comment', rating: 'down', comment: 'Sai kho' })
  assert.deepEqual(feedbackSent(down), { phase: 'sent', rating: 'down', comment: 'Sai kho' })

  const idle = initialFeedback()
  assert.equal(feedbackSent(idle), idle)
  assert.equal(feedbackFailed(idle), idle)
}

function testBuildsRequest() {
  const up = pickRating(initialFeedback(), 'up')
  assert.deepEqual(toFeedbackRequest(up, 'req-1'), { request_id: 'req-1', rating: 'up' })
  const down = submitComment(editComment(pickRating(initialFeedback(), 'down'), 'Sai kho'))
  assert.deepEqual(toFeedbackRequest(down, 'req-1'), { request_id: 'req-1', rating: 'down', comment: 'Sai kho' })
  const skipped = skipComment(pickRating(initialFeedback(), 'down'))
  assert.deepEqual(toFeedbackRequest(skipped, 'req-1'), { request_id: 'req-1', rating: 'down' })
  assert.equal(toFeedbackRequest(initialFeedback(), 'req-1'), null)
}

function main() {
  testOnlyDoneAnswersWithRequestIdCanBeRated()
  testThumbsUpSendsImmediately()
  testThumbsDownOpensCommentFirst()
  testPickingAgainIsIgnoredOnceStarted()
  testEditCommentCutsByCodePointOnlyWhileCommenting()
  testSubmitAndSkipMoveToSending()
  testSentLocksAndFailureAllowsRetry()
  testBuildsRequest()
  console.log('chat-feedback tests passed')
}

main()

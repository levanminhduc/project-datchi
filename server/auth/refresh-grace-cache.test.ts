import assert from 'node:assert/strict'
import { recordRotation, getGraceChild, GRACE_WINDOW_MS } from './refresh-grace-cache'

function testReturnsRecordedChildWithinWindow() {
  recordRotation('oldhash-1', { token: 'access-1', refreshToken: 'refresh-1', expiresAt: 123 })
  const got = getGraceChild('oldhash-1')
  assert.ok(got)
  assert.equal(got.token, 'access-1')
  assert.equal(got.refreshToken, 'refresh-1')
  assert.equal(got.expiresAt, 123)
}

function testReturnsNullForUnknownHash() {
  assert.equal(getGraceChild('never-seen'), null)
}

function testExpiresAfterWindow() {
  const realNow = Date.now
  let now = 1_000_000
  Date.now = () => now
  try {
    recordRotation('oldhash-2', { token: 'a', refreshToken: 'r', expiresAt: 1 })
    now += GRACE_WINDOW_MS + 1
    assert.equal(getGraceChild('oldhash-2'), null)
  } finally {
    Date.now = realNow
  }
}

testReturnsRecordedChildWithinWindow()
testReturnsNullForUnknownHash()
testExpiresAfterWindow()
console.log('refresh-grace-cache tests passed')

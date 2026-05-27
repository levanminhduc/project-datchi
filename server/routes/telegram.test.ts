import assert from 'node:assert/strict'
import { Hono } from 'hono'
import telegramRoutes from './telegram'

async function testRejectsMissingSecret() {
  const originalSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  delete process.env.TELEGRAM_WEBHOOK_SECRET

  try {
    const app = new Hono()
    app.route('/api/telegram', telegramRoutes)

    const response = await app.request('/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    assert.equal(response.status, 503)
  } finally {
    if (originalSecret === undefined) {
      delete process.env.TELEGRAM_WEBHOOK_SECRET
    } else {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalSecret
    }
  }
}

async function testRejectsInvalidSecret() {
  const originalSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  process.env.TELEGRAM_WEBHOOK_SECRET = 'expected-secret'

  try {
    const app = new Hono()
    app.route('/api/telegram', telegramRoutes)

    const response = await app.request('/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'wrong-secret',
      },
      body: JSON.stringify({}),
    })

    assert.equal(response.status, 401)
  } finally {
    if (originalSecret === undefined) {
      delete process.env.TELEGRAM_WEBHOOK_SECRET
    } else {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalSecret
    }
  }
}

async function testAcceptsValidEmptyUpdate() {
  const originalSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  process.env.TELEGRAM_WEBHOOK_SECRET = 'expected-secret'

  try {
    const app = new Hono()
    app.route('/api/telegram', telegramRoutes)

    const response = await app.request('/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'expected-secret',
      },
      body: JSON.stringify({ update_id: 1 }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true })
  } finally {
    if (originalSecret === undefined) {
      delete process.env.TELEGRAM_WEBHOOK_SECRET
    } else {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalSecret
    }
  }
}

await testRejectsMissingSecret()
await testRejectsInvalidSecret()
await testAcceptsValidEmptyUpdate()
console.log('telegram webhook route tests passed')

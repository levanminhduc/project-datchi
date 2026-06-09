import assert from 'node:assert/strict'
import type { ChatAssistantResult } from '../types/chat-assistant'
import {
  GeminiChatError,
  buildGeminiPrompt,
  enhanceChatAnswerWithGemini,
  getGeminiChatConfig,
  queryGeminiAssistant,
} from './chat-assistant-gemini'

const ORIGINAL_ENV = { ...process.env }
const ORIGINAL_FETCH = globalThis.fetch

function restoreGlobals() {
  process.env = { ...ORIGINAL_ENV }
  globalThis.fetch = ORIGINAL_FETCH
}

function makeResult(overrides: Partial<ChatAssistantResult> = {}): ChatAssistantResult {
  return {
    answer: 'Tồn khả dụng của C9700: 10 cuộn nguyên, 1 cuộn lẻ.',
    term: 'C9700',
    tex: '40',
    intents: ['stock'],
    stock: [{
      thread_type_id: 1,
      thread_code: 'COATS-T40-C9700',
      thread_name: 'Coats Epic Tex 40 C9700',
      supplier_name: 'Coats',
      tex_number: '40',
      color_name: 'C9700',
      available_full_cones: 10,
      available_partial_cones: 1,
      partial_meters: 2500,
      partial_weight_grams: 320,
    }],
    usage: [],
    suggestions: [],
    ...overrides,
  }
}

function testGeminiConfigDefaultsToFlashLite25() {
  process.env.GEMINI_API_KEY = 'test-key'
  delete process.env.GEMINI_MODEL

  const config = getGeminiChatConfig()

  assert.equal(config?.model, 'gemini-2.5-flash-lite')
  assert.equal(config?.apiKey, 'test-key')
}

function testGeminiConfigDisabledWithoutApiKey() {
  delete process.env.GEMINI_API_KEY

  assert.equal(getGeminiChatConfig(), null)
}

async function testGeminiQueryUsesServerSideKeyHeader() {
  const calls: Array<{ url: string; init: RequestInit }> = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} })
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: 'C9700 hiện còn 10 cuộn nguyên và 1 cuộn lẻ.' }],
        },
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const answer = await queryGeminiAssistant({
    apiKey: 'server-key',
    model: 'gemini-2.5-flash-lite',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    timeoutMs: 1000,
    maxOutputTokens: 384,
  }, 'C9700 còn bao nhiêu cuộn?', makeResult())

  assert.equal(answer, 'C9700 hiện còn 10 cuộn nguyên và 1 cuộn lẻ.')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent')
  assert.equal((calls[0].init.headers as Record<string, string>)['x-goog-api-key'], 'server-key')
  assert.equal(calls[0].url.includes('server-key'), false)
}

async function testGeminiQuotaErrorIsExplicit() {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { message: 'Resource exhausted' },
  }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  await assert.rejects(
    () => queryGeminiAssistant({
      apiKey: 'server-key',
      model: 'gemini-2.5-flash-lite',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      timeoutMs: 1000,
      maxOutputTokens: 384,
    }, 'C9700 còn bao nhiêu cuộn?', makeResult()),
    (error) => error instanceof GeminiChatError
      && error.statusCode === 429
      && error.message === 'Gemini đã hết quota tạm thời',
  )
}

function testPromptPreservesThreadIdentityBoundary() {
  const prompt = buildGeminiPrompt('C9700 còn bao nhiêu cuộn?', makeResult())

  assert.match(prompt, /Không gộp tồn kho khác NCC, Tex, hoặc Màu/)
  assert.match(prompt, /Coats \/ Tex 40 \/ C9700/)
}

async function testEnhanceUsesGeminiAnswerWhenAvailable() {
  const result = await enhanceChatAnswerWithGemini({
    apiKey: 'server-key',
    model: 'gemini-2.5-flash-lite',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    timeoutMs: 1000,
    maxOutputTokens: 384,
  }, 'C9700 còn bao nhiêu cuộn?', makeResult(), async () => 'Gemini answer')

  assert.equal(result.answer, 'Gemini answer')
  assert.deepEqual(result.source_endpoints, ['gemini:gemini-2.5-flash-lite'])
}

async function testEnhanceFallsBackToLocalAnswerOnQuotaError() {
  const local = makeResult()
  const result = await enhanceChatAnswerWithGemini({
    apiKey: 'server-key',
    model: 'gemini-2.5-flash-lite',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    timeoutMs: 1000,
    maxOutputTokens: 384,
  }, 'C9700 còn bao nhiêu cuộn?', local, async () => {
    throw new GeminiChatError('Gemini đã hết quota tạm thời', 429)
  })

  assert.equal(result.answer, local.answer)
  assert.deepEqual(result.context, {
    gemini_error: 'Gemini đã hết quota tạm thời',
    gemini_status_code: 429,
  })
}

try {
  testGeminiConfigDefaultsToFlashLite25()
  restoreGlobals()
  testGeminiConfigDisabledWithoutApiKey()
  restoreGlobals()
  await testGeminiQueryUsesServerSideKeyHeader()
  restoreGlobals()
  await testGeminiQuotaErrorIsExplicit()
  restoreGlobals()
  testPromptPreservesThreadIdentityBoundary()
  restoreGlobals()
  await testEnhanceUsesGeminiAnswerWhenAvailable()
  restoreGlobals()
  await testEnhanceFallsBackToLocalAnswerOnQuotaError()
  console.log('chat assistant Gemini tests passed')
} finally {
  restoreGlobals()
}

import type { ChatMessage } from '@/components/thread/chat-assistant-messages'
import type { ChatHistoryItem } from '@/types/thread'

const MAX_TURNS = 10
const MAX_CONTENT = 2000

function cutByCodePoint(text: string, limit: number): string {
  return Array.from(text).slice(0, limit).join('')
}

export function buildChatHistory(messages: ChatMessage[], beforeIndex: number): ChatHistoryItem[] {
  const history: ChatHistoryItem[] = []
  const end = Math.min(beforeIndex, messages.length)

  for (let index = 0; index + 1 < end; index += 1) {
    const question = messages[index]
    const answer = messages[index + 1]
    if (!question || !answer || question.role !== 'user' || answer.role !== 'assistant') continue
    if (question.status !== 'done' || answer.status !== 'done') continue
    if (answer.answerKind && answer.answerKind !== 'answer') continue

    const questionText = question.text.trim()
    const answerText = answer.text.trim()
    if (!questionText || !answerText) continue

    history.push(
      { role: 'user', content: cutByCodePoint(questionText, MAX_CONTENT) },
      { role: 'assistant', content: cutByCodePoint(answerText, MAX_CONTENT) },
    )
    index += 1
  }

  return history.slice(-MAX_TURNS * 2)
}

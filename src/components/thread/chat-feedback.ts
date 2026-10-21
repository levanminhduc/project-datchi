import type { ChatFeedbackRating, ChatFeedbackRequest } from '@/types/thread'
import type { ChatMessage } from './chat-assistant-messages'

export type FeedbackRating = ChatFeedbackRating

export interface FeedbackState {
  phase: 'idle' | 'comment' | 'sending' | 'sent'
  rating: FeedbackRating | null
  comment: string
}

export const FEEDBACK_COMMENT_MAX = 500

export function canRate(message: Pick<ChatMessage, 'status' | 'answerKind' | 'requestId'>): boolean {
  return message.status === 'done' && message.answerKind === 'answer' && !!message.requestId
}

export function initialFeedback(): FeedbackState {
  return { phase: 'idle', rating: null, comment: '' }
}

export function pickRating(state: FeedbackState, rating: FeedbackRating): FeedbackState {
  if (state.phase !== 'idle') return state
  return { phase: rating === 'up' ? 'sending' : 'comment', rating, comment: '' }
}

export function editComment(state: FeedbackState, comment: string): FeedbackState {
  if (state.phase !== 'comment') return state
  return { ...state, comment: Array.from(comment).slice(0, FEEDBACK_COMMENT_MAX).join('') }
}

export function submitComment(state: FeedbackState): FeedbackState {
  if (state.phase !== 'comment') return state
  return { ...state, phase: 'sending', comment: state.comment.trim() }
}

export function skipComment(state: FeedbackState): FeedbackState {
  if (state.phase !== 'comment') return state
  return { ...state, phase: 'sending', comment: '' }
}

export function feedbackSent(state: FeedbackState): FeedbackState {
  if (state.phase !== 'sending') return state
  return { ...state, phase: 'sent' }
}

export function feedbackFailed(state: FeedbackState): FeedbackState {
  if (state.phase !== 'sending') return state
  if (state.rating === 'down') return { ...state, phase: 'comment' }
  return initialFeedback()
}

export function toFeedbackRequest(state: FeedbackState, requestId: string): ChatFeedbackRequest | null {
  if (state.phase !== 'sending' || !state.rating) return null
  return {
    request_id: requestId,
    rating: state.rating,
    ...(state.comment ? { comment: state.comment } : {}),
  }
}

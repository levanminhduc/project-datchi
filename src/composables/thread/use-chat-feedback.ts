import { reactive } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { chatAssistantService } from '@/services'
import {
  editComment,
  feedbackFailed,
  feedbackSent,
  initialFeedback,
  pickRating,
  skipComment,
  submitComment,
  toFeedbackRequest,
  type FeedbackRating,
  type FeedbackState,
} from '@/components/thread/chat-feedback'

const SEND_ERROR = 'Không gửi được đánh giá. Vui lòng thử lại.'

const states = reactive(new Map<string, FeedbackState>())

export function useChatFeedback() {
  const snackbar = useSnackbar()

  function stateOf(requestId: string): FeedbackState {
    return states.get(requestId) ?? initialFeedback()
  }

  async function send(requestId: string) {
    const request = toFeedbackRequest(stateOf(requestId), requestId)
    if (!request) return
    try {
      await chatAssistantService.feedback(request)
      states.set(requestId, feedbackSent(stateOf(requestId)))
    } catch {
      states.set(requestId, feedbackFailed(stateOf(requestId)))
      snackbar.error(SEND_ERROR)
    }
  }

  async function advance(requestId: string, next: (state: FeedbackState) => FeedbackState) {
    const current = stateOf(requestId)
    const updated = next(current)
    if (updated === current) return
    states.set(requestId, updated)
    if (updated.phase === 'sending') await send(requestId)
  }

  return {
    stateOf,
    rate: (requestId: string, rating: FeedbackRating) => advance(requestId, (state) => pickRating(state, rating)),
    setComment: (requestId: string, comment: string) => advance(requestId, (state) => editComment(state, comment)),
    submit: (requestId: string) => advance(requestId, submitComment),
    skip: (requestId: string) => advance(requestId, skipComment),
  }
}

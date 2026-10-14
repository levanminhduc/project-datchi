<template>
  <div class="answer-content">
    <template
      v-for="(block, blockIndex) in blocks"
      :key="blockIndex"
    >
      <ul
        v-if="block.type === 'list'"
        class="answer-list"
      >
        <li
          v-for="(line, lineIndex) in block.lines"
          :key="lineIndex"
        >
          <template
            v-for="(segment, segmentIndex) in line"
            :key="segmentIndex"
          >
            <strong v-if="segment.bold">{{ segment.text }}</strong>
            <span v-else>{{ segment.text }}</span>
          </template>
        </li>
      </ul>
      <div
        v-else
        class="answer-paragraph"
      >
        <p
          v-for="(line, lineIndex) in block.lines"
          :key="lineIndex"
        >
          <template
            v-for="(segment, segmentIndex) in line"
            :key="segmentIndex"
          >
            <strong v-if="segment.bold">{{ segment.text }}</strong>
            <span v-else>{{ segment.text }}</span>
          </template>
        </p>
      </div>
    </template>

    <ChatStockResult
      v-if="message.stockRows?.length"
      class="answer-stock"
      :rows="message.stockRows"
      :compact="compact"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  parseAnswerBlocks,
  type ChatMessage,
} from '@/components/thread/chat-assistant-messages'
import ChatStockResult from './ChatStockResult.vue'

const props = withDefaults(
  defineProps<{
    message: ChatMessage
    compact?: boolean
  }>(),
  { compact: false },
)

const blocks = computed(() => parseAnswerBlocks(props.message.text))
</script>

<style scoped lang="scss">
.answer-content {
  min-width: 0;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.answer-paragraph,
.answer-list {
  max-width: 60ch;
  margin: 0 0 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.answer-paragraph p {
  margin: 0 0 4px;

  &:last-child {
    margin-bottom: 0;
  }
}

.answer-list {
  padding-left: 20px;

  li + li {
    margin-top: 2px;
  }
}

.answer-stock {
  margin-top: 12px;
}
</style>

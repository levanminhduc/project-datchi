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
        v-else-if="block.type === 'table'"
        class="answer-table-wrap"
        tabindex="0"
        role="region"
        aria-label="Bảng kết quả"
      >
        <table class="answer-table">
          <thead>
            <tr>
              <th
                v-for="(cell, cellIndex) in block.headers"
                :key="cellIndex"
                scope="col"
                :class="{ 'is-numeric': block.numeric[cellIndex] }"
              >
                <template
                  v-for="(segment, segmentIndex) in cell"
                  :key="segmentIndex"
                >
                  <strong v-if="segment.bold">{{ segment.text }}</strong>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in block.rows"
              :key="rowIndex"
            >
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                :class="{ 'is-numeric': block.numeric[cellIndex] }"
              >
                <template
                  v-for="(segment, segmentIndex) in cell"
                  :key="segmentIndex"
                >
                  <strong v-if="segment.bold">{{ segment.text }}</strong>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

.answer-table-wrap {
  max-width: 100%;
  margin: 0 0 8px;
  overflow-x: auto;
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  background: var(--chat-surface);

  &:last-child {
    margin-bottom: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
  }
}

.answer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.4;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--chat-border);
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    overflow-wrap: normal;
  }

  th {
    background: var(--chat-hover);
    color: var(--chat-muted);
    font-size: 12px;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .is-numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.answer-stock {
  margin-top: 12px;
}
</style>

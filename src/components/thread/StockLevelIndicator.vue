<template>
  <div
    class="stock-level-indicator row items-center no-wrap q-gutter-sm"
    :class="{ 'cursor-pointer': clickable }"
    @click="handleClick"
  >
    <!-- Traffic Light Icon -->
    <q-avatar
      :size="size"
      :color="indicatorColor"
      text-color="white"
    >
      <q-icon
        :name="indicatorIcon"
        :size="iconSize"
      />
    </q-avatar>

    <!-- Info -->
    <div
      v-if="showDetails"
      class="column"
    >
      <span class="text-subtitle2 text-weight-medium">{{ threadType }}</span>
      <div class="row items-center q-gutter-xs">
        <span :class="['text-caption', `text-${indicatorColor}`]">
          {{ statusLabel }}
        </span>
        <span class="text-caption text-grey">
          ({{ formatNumber(quantity) }} / {{ formatNumber(reorderLevel) }})
        </span>
      </div>
    </div>

    <!-- Tooltip -->
    <q-tooltip v-if="!showDetails">
      <div>{{ threadType }}</div>
      <div>{{ statusLabel }}: {{ formatNumber(quantity) }}m</div>
      <div>Mức đặt lại: {{ formatNumber(reorderLevel) }}m</div>
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  /** Stock level status */
  level: 'ok' | 'low' | 'critical'
  /** Thread type name/code */
  threadType: string
  /** Current quantity in meters */
  quantity: number
  /** Reorder level threshold */
  reorderLevel: number
  /** Show detailed text */
  showDetails?: boolean
  /** Size of the indicator */
  size?: string
  /** Make clickable */
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  size: '40px',
  clickable: false,
})

// Emits
const emit = defineEmits<{
  click: []
}>()

// Computed
const indicatorColor = computed(() => {
  switch (props.level) {
    case 'ok':
      return 'positive'
    case 'low':
      return 'warning'
    case 'critical':
      return 'negative'
    default:
      return 'grey'
  }
})

const indicatorIcon = computed(() => {
  switch (props.level) {
    case 'ok':
      return 'check_circle'
    case 'low':
      return 'warning'
    case 'critical':
      return 'error'
    default:
      return 'help'
  }
})

const statusLabel = computed(() => {
  switch (props.level) {
    case 'ok':
      return 'Đủ hàng'
    case 'low':
      return 'Tồn thấp'
    case 'critical':
      return 'Sắp hết'
    default:
      return 'Không xác định'
  }
})

const iconSize = computed(() => {
  const sizeNum = parseInt(props.size)
  return `${Math.round(sizeNum * 0.5)}px`
})

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stock-level-indicator {
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.stock-level-indicator.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>

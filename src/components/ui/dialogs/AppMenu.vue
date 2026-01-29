<script setup lang="ts">
/**
 * AppMenu - Dropdown menu wrapper
 * Wraps QMenu with items array support
 */
import type { UIMenuItem } from '@/types/ui'

type AnchorPosition = 
  | 'top left' | 'top middle' | 'top right' | 'top start' | 'top end'
  | 'center left' | 'center middle' | 'center right' | 'center start' | 'center end'  
  | 'bottom left' | 'bottom middle' | 'bottom right' | 'bottom start' | 'bottom end'

interface Props {
  /** Menu items to display */
  items?: UIMenuItem[]
  /** Anchor point on target */
  anchor?: AnchorPosition
  /** Self alignment point */
  self?: AnchorPosition
  /** Position offset [x, y] */
  offset?: [number, number]
  /** Auto close on item click */
  autoClose?: boolean
  /** Context menu mode */
  contextMenu?: boolean
  /** Touch position for context menu */
  touchPosition?: boolean
  /** Max height of menu */
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  anchor: 'bottom end',
  self: 'top end',
  autoClose: true,
  contextMenu: false,
  touchPosition: false,
  maxHeight: '300px'
})

const emit = defineEmits<{
  'item-click': [item: UIMenuItem]
}>()

const handleItemClick = (item: UIMenuItem) => {
  if (item.disable) return
  if (item.onClick) item.onClick()
  emit('item-click', item)
}
</script>

<template>
  <q-menu
    :anchor="props.anchor"
    :self="props.self"
    :offset="props.offset"
    :auto-close="props.autoClose"
    :context-menu="props.contextMenu"
    :touch-position="props.touchPosition"
    :style="{ maxHeight: props.maxHeight }"
  >
    <q-list dense>
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <q-separator v-if="item.separator" />
        <q-item
          v-else
          v-close-popup="props.autoClose"
          :clickable="!item.disable"
          :disable="item.disable"
          :to="item.to"
          :href="item.href"
          :target="item.href ? '_blank' : undefined"
          @click="handleItemClick(item)"
        >
          <q-item-section
            v-if="item.icon"
            avatar
          >
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </q-item>
      </template>

      <slot />
    </q-list>
  </q-menu>
</template>

<template>
  <div
    class="wf-node"
    :class="[
      `wf-node--${state}`,
      {
        'wf-node--decision': decision,
        'wf-node--selected': selected,
        'wf-node--clickable': clickable,
        'wf-node--dimmed': dimmed,
      },
    ]"
    @click="clickable ? $emit('select') : undefined"
  >
    <div class="wf-node-header">
      <q-icon
        :name="icon"
        size="17px"
      />
      <span class="wf-node-title">{{ title }}</span>
      <q-space />
      <q-icon
        v-if="hint"
        name="o_info"
        size="15px"
        class="wf-node-hint"
        @click.stop
      >
        <AppTooltip>
          <div class="text-weight-medium">
            {{ kindLabel }}
          </div>
          {{ hint }}
        </AppTooltip>
      </q-icon>
      <q-btn
        v-if="linkTo"
        flat
        round
        dense
        size="xs"
        icon="open_in_new"
        :to="linkTo"
        @click.stop
      >
        <AppTooltip>Mở trang liên quan</AppTooltip>
      </q-btn>
    </div>
    <div class="wf-node-body">
      <q-chip
        v-if="statusChip"
        :color="statusChip.color"
        text-color="white"
        dense
        size="sm"
        class="q-ma-none q-mb-xs"
      >
        {{ statusChip.label }}
      </q-chip>
      <div
        v-if="kindLabel"
        class="wf-node-kind"
      >
        {{ kindLabel }}
      </div>
      <div
        v-if="value !== undefined"
        class="wf-node-value"
      >
        {{ value }}<span class="wf-node-unit"> {{ unit }}</span>
      </div>
      <div
        v-for="line in subLines"
        :key="line.label"
        class="wf-node-subline"
      >
        {{ line.label }}: <strong>{{ line.value }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import { WORKFLOW_NODE_KIND_LABEL, type WorkflowNodeKind } from './workflow-format'

export interface WorkflowNodeSubLine {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  title: string
  icon: string
  kind?: WorkflowNodeKind
  hint?: string
  state?: 'idle' | 'active' | 'done'
  value?: string
  unit?: string
  subLines?: WorkflowNodeSubLine[]
  statusChip?: { label: string; color: string } | null
  decision?: boolean
  selected?: boolean
  clickable?: boolean
  dimmed?: boolean
  linkTo?: string
}>(), {
  kind: undefined,
  hint: undefined,
  state: 'idle',
  value: undefined,
  unit: 'cuộn',
  subLines: () => [],
  statusChip: null,
  decision: false,
  selected: false,
  clickable: false,
  dimmed: false,
  linkTo: undefined,
})

defineEmits<{
  (e: 'select'): void
}>()

const kindLabel = computed(() => (props.kind ? WORKFLOW_NODE_KIND_LABEL[props.kind] : ''))
</script>

<style scoped lang="scss">
.wf-node {
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 8px 12px 10px;
  min-width: 148px;
  max-width: 220px;
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease, opacity 0.25s ease;
}

.wf-node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #616161;
}

.wf-node-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1.2;
}

.wf-node-body {
  margin-top: 6px;
}

.wf-node-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: #757575;
}

.wf-node-unit {
  font-size: 12px;
  font-weight: 500;
}

.wf-node-hint {
  color: #9e9e9e;
  cursor: help;
}

.wf-node-kind {
  font-size: 10px;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.wf-node-subline {
  font-size: 11px;
  color: #757575;
  line-height: 1.4;
}

.wf-node--active {
  border-color: #fb8c00;
  background: #fff8f0;

  .wf-node-value {
    color: #ef6c00;
  }
}

.wf-node--done {
  border-color: #43a047;
  background: #f4fbf4;

  .wf-node-value {
    color: #2e7d32;
  }
}

.wf-node--decision {
  border-style: dashed;
  border-color: #5c6bc0;
  background: #f3f6ff;
}

.wf-node--clickable {
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  }
}

.wf-node--selected {
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.25);
}

.wf-node--dimmed {
  opacity: 0.3;
}
</style>

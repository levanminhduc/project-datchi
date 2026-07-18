<template>
  <router-link
    :to="to"
    class="hub-nav-link"
    :style="linkStyle"
  >
    <AppCard
      class="hub-nav-card full-height"
      bordered
    >
      <q-card-section class="row items-center no-wrap q-pa-md">
        <div class="hub-icon">
          <q-icon
            :name="icon"
            size="24px"
          />
        </div>
        <div class="q-ml-md col hub-text">
          <div class="text-subtitle2 text-weight-bold hub-title">
            {{ title }}
          </div>
          <div
            v-if="caption"
            class="text-caption hub-caption"
          >
            {{ caption }}
          </div>
        </div>
      </q-card-section>
    </AppCard>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppCard from './AppCard.vue'

const props = withDefaults(defineProps<{
  title: string
  caption?: string
  icon: string
  to: string
  color?: string
}>(), {
  caption: '',
  color: '#1976D2',
})

const hexToRgba = (hex: string, alpha: number) => {
  const v = hex.replace('#', '')
  const r = parseInt(v.substring(0, 2), 16)
  const g = parseInt(v.substring(2, 4), 16)
  const b = parseInt(v.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const linkStyle = computed(() => ({
  '--hub-color': props.color,
  '--hub-icon-bg': hexToRgba(props.color, 0.12),
  '--hub-hover-border': hexToRgba(props.color, 0.35),
}))
</script>

<style scoped lang="scss">
.hub-nav-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.full-height {
  height: 100%;
}

.hub-nav-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: 100%;
}

.hub-nav-link:hover .hub-nav-card {
  transform: translateY(-3px);
  border-color: var(--hub-hover-border);
}

.hub-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--hub-icon-bg);
  color: var(--hub-color);
  transition: transform 0.25s ease;
}

.hub-nav-link:hover .hub-icon {
  transform: scale(1.05);
}

.hub-text {
  min-width: 0;
}

.hub-title {
  line-height: 1.3;
  color: var(--q-primary);
}

.hub-caption {
  line-height: 1.35;
  opacity: 0.65;
  margin-top: 2px;
}
</style>

<style lang="scss">
.body--light .hub-nav-link:hover .hub-nav-card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.body--dark .hub-nav-link:hover .hub-nav-card {
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.08);
}
</style>

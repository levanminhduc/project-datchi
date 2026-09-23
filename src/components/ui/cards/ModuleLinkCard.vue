<template>
  <router-link
    :to="to"
    class="module-link"
  >
    <AppCard
      class="module-card full-height"
      bordered
    >
      <q-card-section class="module-card__body row items-center no-wrap q-pa-md">
        <q-avatar
          :color="color"
          text-color="white"
          size="52px"
          :icon="icon"
          class="module-avatar"
        />
        <div class="q-ml-md col module-text">
          <div class="text-subtitle1 text-weight-medium module-title">
            {{ title }}
          </div>
          <div
            v-if="description"
            class="text-caption module-description"
          >
            {{ description }}
          </div>
        </div>
        <q-icon
          name="chevron_right"
          size="20px"
          class="module-arrow"
        />
      </q-card-section>
    </AppCard>
  </router-link>
</template>

<script setup lang="ts">
import AppCard from './AppCard.vue'

withDefaults(defineProps<{
  title: string
  description?: string
  icon: string
  to: string
  color?: string
}>(), {
  description: '',
  color: 'primary',
})
</script>

<style scoped lang="scss">
.module-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.full-height {
  height: 100%;
}

.module-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: 100%;

  &:hover {
    transform: translateY(-3px);

    :deep(.module-avatar) {
      transform: scale(1.05);
    }

    .module-arrow {
      transform: translateX(3px);
      opacity: 1;
    }
  }
}

.module-card__body {
  min-height: 88px;
  align-items: center;
}

.module-avatar {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.module-text {
  min-width: 0;
}

.module-title {
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.module-description {
  line-height: 1.4;
  opacity: 0.7;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  margin-top: 2px;
}

.module-arrow {
  opacity: 0.4;
  transition: all 0.25s ease;
  flex-shrink: 0;
  color: var(--q-secondary);
  align-self: center;
}
</style>

<style lang="scss">
.body--light .module-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.body--dark .module-card:hover {
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.08);
}
</style>

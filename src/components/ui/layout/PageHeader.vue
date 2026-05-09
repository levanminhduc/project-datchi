<script setup lang="ts">
/**
 * PageHeader - Page title header component
 * Displays page title with optional back button, subtitle, and actions
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  backTo?: string
  showBack?: boolean
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  icon: undefined,
  backTo: undefined,
  showBack: false,
  dense: false
})

const router = useRouter()

const goBack = () => {
  if (props.backTo) {
    router.push(props.backTo)
  } else {
    router.back()
  }
}

const headerClass = computed(() => ({
  'q-py-sm': props.dense,
  'q-py-md': !props.dense
}))
</script>

<template>
  <div
    class="page-header q-mb-md"
    :class="headerClass"
  >
    <!-- Back button + Icon + Title -->
    <div class="page-header__main row items-center no-wrap">
      <q-btn
        v-if="showBack"
        flat
        round
        icon="arrow_back"
        color="primary"
        class="q-mr-sm"
        @click="goBack"
      />
      <q-icon
        v-if="icon"
        :name="icon"
        size="28px"
        class="q-mr-sm"
      />
      <div class="page-header__copy">
        <div class="page-header__title text-h5 text-weight-bold text-primary">
          {{ title }}
        </div>
        <div
          v-if="subtitle"
          class="page-header__subtitle text-caption text-grey"
        >
          {{ subtitle }}
        </div>
      </div>
    </div>

    <!-- Breadcrumbs + Actions -->
    <div
      v-if="$slots.breadcrumbs || $slots.actions"
      class="page-header__actions row items-center justify-end"
    >
      <slot name="breadcrumbs" />
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  align-items: center;
  column-gap: 16px;
  display: flex;
  flex-wrap: wrap;
  row-gap: 10px;
  min-height: 48px;
}

.page-header__main {
  flex: 1 1 280px;
  min-width: 0;
}

.page-header__copy {
  min-width: 0;
}

.page-header__title,
.page-header__subtitle {
  overflow-wrap: break-word;
}

.page-header__subtitle {
  line-height: 1.4;
  max-width: 72ch;
}

.page-header__actions {
  flex: 0 1 auto;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}

@media (max-width: 599.98px) {
  .page-header {
    align-items: flex-start;
  }

  .page-header__main,
  .page-header__actions {
    flex-basis: 100%;
    width: 100%;
  }

  .page-header__actions {
    justify-content: flex-start;
  }

  .page-header__actions :deep(.q-btn) {
    flex: 1 1 168px;
    min-width: 0;
  }

  .page-header__actions :deep(.q-btn__content) {
    min-width: 0;
    white-space: normal;
  }
}

@media (max-width: 359.98px) {
  .page-header__actions :deep(.q-btn) {
    flex-basis: 100%;
  }
}
</style>

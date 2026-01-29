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
    class="page-header row items-center q-mb-md"
    :class="headerClass"
  >
    <!-- Back button -->
    <q-btn
      v-if="showBack"
      flat
      round
      dense
      icon="mdi-arrow-left"
      class="q-mr-sm"
      @click="goBack"
    />

    <!-- Icon -->
    <q-icon
      v-if="icon"
      :name="icon"
      size="28px"
      class="q-mr-sm"
    />

    <!-- Title & Subtitle -->
    <div class="col">
      <div class="text-h5 text-weight-medium">
        {{ title }}
      </div>
      <div
        v-if="subtitle"
        class="text-caption text-grey"
      >
        {{ subtitle }}
      </div>
    </div>

    <!-- Breadcrumbs slot -->
    <slot name="breadcrumbs" />

    <!-- Actions slot -->
    <div class="row q-gutter-sm">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  min-height: 48px;
}
</style>

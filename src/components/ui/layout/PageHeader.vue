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
    class="page-header row wrap items-center q-mb-md"
    :class="headerClass"
  >
    <!-- Back button + Icon + Title -->
    <div class="col row items-center no-wrap">
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
      <div>
        <div class="text-h5 text-weight-bold text-primary">
          {{ title }}
        </div>
        <div
          v-if="subtitle"
          class="text-caption text-grey"
        >
          {{ subtitle }}
        </div>
      </div>
    </div>

    <!-- Breadcrumbs + Actions -->
    <div class="col-auto row items-center justify-end q-gutter-sm">
      <slot name="breadcrumbs" />
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  min-height: 48px;
}
</style>

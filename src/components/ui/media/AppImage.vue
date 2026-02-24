<script setup lang="ts">
/**
 * AppImage - Image wrapper with loading state
 * Wraps QImg with standardized props
 */

interface Props {
  src: string
  alt?: string
  srcset?: string
  sizes?: string
  ratio?: string | number
  width?: string
  height?: string
  fit?: 'cover' | 'fill' | 'contain' | 'none' | 'scale-down'
  position?: string
  loading?: 'eager' | 'lazy'
  noDefaultSpinner?: boolean
  noSpinner?: boolean
  noNativeMenu?: boolean
  noTransition?: boolean
  spinnerColor?: string
  spinnerSize?: string
  placeholder?: string
  errorIcon?: string
  draggable?: boolean
  imgClass?: string
  imgStyle?: string | Record<string, string>
}

withDefaults(defineProps<Props>(), {
  alt: '',
  fit: 'cover',
  position: 'center',
  loading: 'lazy',
  noDefaultSpinner: false,
  noSpinner: false,
  noNativeMenu: false,
  noTransition: false,
  spinnerColor: 'primary',
  errorIcon: 'mdi-image-broken-variant',
  draggable: true
})

const emit = defineEmits<{
  load: [src: string]
  error: [src: string]
}>()
</script>

<template>
  <q-img
    :src="src"
    :alt="alt"
    :srcset="srcset"
    :sizes="sizes"
    :ratio="ratio"
    :width="width"
    :height="height"
    :fit="fit"
    :position="position"
    :loading="loading"
    :no-default-spinner="noDefaultSpinner"
    :no-spinner="noSpinner"
    :no-native-menu="noNativeMenu"
    :no-transition="noTransition"
    :spinner-color="spinnerColor"
    :spinner-size="spinnerSize"
    :placeholder-src="placeholder"
    :draggable="draggable"
    :img-class="imgClass"
    :img-style="imgStyle"
    @load="emit('load', src)"
    @error="emit('error', src)"
  >
    <template #error>
      <slot name="error">
        <div class="absolute-full flex flex-center bg-grey-3">
          <q-icon
            :name="errorIcon"
            size="40px"
            color="grey-6"
          />
        </div>
      </slot>
    </template>
    <slot />
  </q-img>
</template>

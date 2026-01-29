<script setup lang="ts">
/**
 * AppCarousel - Image carousel wrapper
 * Wraps QCarousel with slides array support
 */
import { computed } from 'vue'

interface CarouselSlide {
  src: string
  caption?: string
  alt?: string
  thumbnail?: string
}

interface Props {
  modelValue?: string | number
  slides?: CarouselSlide[]
  vertical?: boolean
  autoplay?: boolean | number
  arrows?: boolean
  prevIcon?: string
  nextIcon?: string
  navigation?: boolean
  thumbnails?: boolean
  infinite?: boolean
  swipeable?: boolean
  animated?: boolean
  transitionPrev?: string
  transitionNext?: string
  transitionDuration?: number
  dark?: boolean
  height?: string
  controlColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [],
  vertical: false,
  autoplay: false,
  arrows: true,
  prevIcon: 'mdi-chevron-left',
  nextIcon: 'mdi-chevron-right',
  navigation: true,
  thumbnails: false,
  infinite: true,
  swipeable: true,
  animated: true,
  transitionPrev: 'slide-right',
  transitionNext: 'slide-left',
  transitionDuration: 300,
  dark: false,
  height: '300px',
  controlColor: 'white'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const slideValue = computed({
  get: () => props.modelValue ?? 0,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <q-carousel
    v-model="slideValue"
    :vertical="vertical"
    :autoplay="autoplay"
    :arrows="arrows"
    :prev-icon="prevIcon"
    :next-icon="nextIcon"
    :navigation="navigation"
    :thumbnails="thumbnails"
    :infinite="infinite"
    :swipeable="swipeable"
    :animated="animated"
    :transition-prev="transitionPrev"
    :transition-next="transitionNext"
    :transition-duration="transitionDuration"
    :dark="dark"
    :height="height"
    :control-color="controlColor"
  >
    <q-carousel-slide
      v-for="(slide, index) in slides"
      :key="index"
      :name="index"
      :img-src="slide.src"
    >
      <div
        v-if="slide.caption"
        class="absolute-bottom custom-caption"
      >
        <div class="text-subtitle1">
          {{ slide.caption }}
        </div>
      </div>
    </q-carousel-slide>
    <slot />
  </q-carousel>
</template>

<style scoped>
.custom-caption {
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  text-align: center;
  color: white;
}
</style>

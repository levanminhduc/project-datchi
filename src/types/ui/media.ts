/**
 * Media component types
 */

/** Carousel slide configuration */
export interface CarouselSlide {
  src: string
  caption?: string
  alt?: string
  thumbnail?: string
}

/** AppCarousel props */
export interface AppCarouselProps {
  modelValue?: string | number
  slides?: CarouselSlide[]
  vertical?: boolean
  autoplay?: boolean | number
  arrows?: boolean
  prevIcon?: string
  nextIcon?: string
  navigation?: boolean
  navigationIcon?: string
  navigationActiveIcon?: string
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
  controlTextColor?: string
  controlType?: 'regular' | 'flat' | 'outline' | 'push' | 'unelevated'
}

/** AppImage props */
export interface AppImageProps {
  src: string
  alt?: string
  srcset?: string
  sizes?: string
  ratio?: string | number
  initialRatio?: string | number
  width?: string
  height?: string
  fit?: 'cover' | 'fill' | 'contain' | 'none' | 'scale-down'
  position?: string
  loading?: 'eager' | 'lazy'
  fetchpriority?: 'high' | 'low' | 'auto'
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

/** AppVideo props */
export interface AppVideoProps {
  src: string
  ratio?: string | number
  title?: string
}

/** AppParallax props */
export interface AppParallaxProps {
  src: string
  height?: number
  speed?: number
  scrollTarget?: string | Element
}

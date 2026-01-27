import type { Size, Color, BaseComponentProps } from './base'

/**
 * AppSpinner props - Spinner loading indicator
 */
export interface AppSpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: Size | string
  /** Spinner color */
  color?: Color | string
  /** Thickness (for some spinner types) */
  thickness?: number
}

/**
 * AppProgress props - Linear progress indicator
 */
export interface AppProgressProps extends BaseComponentProps {
  /** Progress value (0-1) */
  value?: number
  /** Buffer value (0-1) for buffering progress */
  buffer?: number
  /** Indeterminate mode */
  indeterminate?: boolean
  /** Query mode (reverse direction) */
  query?: boolean
  /** Stripe effect */
  stripe?: boolean
  /** Animation speed */
  animationSpeed?: number
  /** Color */
  color?: Color | string
  /** Track color */
  trackColor?: string
  /** Instant update (no animation) */
  instantFeedback?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Height/thickness */
  size?: string
  /** Show value inside */
  showValue?: boolean
  /** Dark mode */
  dark?: boolean
}

/**
 * CircularProgress props - Circular progress indicator
 */
export interface CircularProgressProps extends BaseComponentProps {
  /** Progress value (0-1) */
  value?: number
  /** Indeterminate mode */
  indeterminate?: boolean
  /** Color */
  color?: Color | string
  /** Track color */
  trackColor?: string
  /** Center color */
  centerColor?: string
  /** Size */
  size?: string
  /** Font size */
  fontSize?: string
  /** Thickness */
  thickness?: number
  /** Min value */
  min?: number
  /** Max value */
  max?: number
  /** Reverse direction */
  reverse?: boolean
  /** Instant update */
  instantFeedback?: boolean
  /** Show value */
  showValue?: boolean
  /** Angle offset */
  angle?: number
  /** Animation speed */
  animationSpeed?: number
  /** Rounded line caps */
  rounded?: boolean
  /** Dark mode */
  dark?: boolean
}

/**
 * AppSkeleton props - Skeleton loading placeholder
 */
export interface AppSkeletonProps extends BaseComponentProps {
  /** Skeleton type */
  type?: 'text' | 'rect' | 'circle' | 'QBtn' | 'QBadge' | 'QChip' | 'QToolbar' | 'QCheckbox' | 'QRadio' | 'QToggle' | 'QSlider' | 'QRange' | 'QInput' | 'QAvatar'
  /** Animation type */
  animation?: 'wave' | 'pulse' | 'pulse-x' | 'pulse-y' | 'fade' | 'blink' | 'none'
  /** Animation speed (ms) */
  animationSpeed?: number
  /** Square shape (no border radius) */
  square?: boolean
  /** Bordered */
  bordered?: boolean
  /** Size */
  size?: string
  /** Width */
  width?: string
  /** Height */
  height?: string
  /** Dark mode */
  dark?: boolean
}

/**
 * EmptyState props - Empty state display
 */
export interface EmptyStateProps extends BaseComponentProps {
  /** Icon name */
  icon?: string
  /** Icon size */
  iconSize?: string
  /** Icon color */
  iconColor?: string
  /** Title text */
  title?: string
  /** Subtitle text */
  subtitle?: string
}

/**
 * AppBanner props - Banner notification
 */
export interface AppBannerProps extends BaseComponentProps {
  /** v-model for visibility */
  modelValue?: boolean
  /** Inline mode (no padding) */
  inline?: boolean
  /** Dense padding */
  dense?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Dark mode */
  dark?: boolean
}

/**
 * InnerLoading props - Inner loading overlay
 */
export interface InnerLoadingProps extends BaseComponentProps {
  /** Show loading */
  showing?: boolean
  /** Dark overlay */
  dark?: boolean
  /** Transition show */
  transitionShow?: string
  /** Transition hide */
  transitionHide?: string
  /** Transition duration */
  transitionDuration?: number | string
  /** Size */
  size?: Size | string
  /** Color */
  color?: Color | string
  /** Custom label */
  label?: string
  /** Label class */
  labelClass?: string
  /** Label style */
  labelStyle?: string | object
}

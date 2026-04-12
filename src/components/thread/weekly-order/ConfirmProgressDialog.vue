<template>
  <AppDialog
    :model-value="modelValue"
    :persistent="isLoading"
    :no-esc-dismiss="isLoading"
    :no-backdrop-dismiss="true"
    width="420px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="row items-center q-gutter-sm text-primary">
        <q-icon
          name="assignment_turned_in"
          size="24px"
        />
        <span>Xác nhận đơn hàng</span>
      </div>
    </template>

    <div class="confirm-progress">
      <AppProgress
        :value="progressValue"
        size="6px"
        :color="progressColor"
        track-color="grey-3"
        rounded
        class="q-mb-lg"
      />

      <div class="steps-container">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-row"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="step-indicator">
            <div
              class="step-circle"
              :class="stepCircleClass(step.status)"
            >
              <Transition
                name="step-icon"
                mode="out-in"
              >
                <q-icon
                  v-if="step.status === 'pending'"
                  :key="'pending'"
                  name="circle"
                  size="14px"
                  color="grey-4"
                />
                <q-spinner-dots
                  v-else-if="step.status === 'loading'"
                  :key="'loading'"
                  size="18px"
                  color="white"
                />
                <q-icon
                  v-else-if="step.status === 'success'"
                  :key="'success'"
                  name="check"
                  size="18px"
                  color="white"
                  class="success-pop"
                />
                <q-icon
                  v-else-if="step.status === 'error'"
                  :key="'error'"
                  name="close"
                  size="18px"
                  color="white"
                />
              </Transition>
            </div>

            <div
              v-if="index < steps.length - 1"
              class="step-connector"
              :class="{
                'step-connector--done': step.status === 'success',
                'step-connector--error': step.status === 'error',
              }"
            />
          </div>

          <div class="step-content col">
            <div
              class="step-label"
              :class="{
                'text-weight-bold text-primary': step.status === 'loading',
                'text-primary': step.status === 'success',
                'text-negative text-weight-bold': step.status === 'error',
                'text-grey-5': step.status === 'pending',
              }"
            >
              {{ step.label }}
              <span
                v-if="step.status === 'loading'"
                class="loading-dots"
              />
            </div>
            <Transition name="fade-slide">
              <div
                v-if="step.status === 'error' && step.errorMessage"
                class="step-error"
              >
                {{ step.errorMessage }}
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <Transition name="fade-slide">
        <div
          v-if="allSuccess"
          class="success-banner"
        >
          <q-icon
            name="verified"
            size="20px"
            color="primary"
          />
          <span class="text-primary text-weight-medium">Hoàn tất xác nhận!</span>
        </div>
      </Transition>
    </div>

    <template
      v-if="canDismiss"
      #actions
    >
      <AppButton
        :color="allSuccess ? 'primary' : 'grey'"
        :flat="!allSuccess"
        :label="allSuccess ? 'Hoàn tất' : 'Đóng'"
        :icon="allSuccess ? 'done_all' : undefined"
        @click="$emit('update:modelValue', false)"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppProgress from '@/components/ui/feedback/AppProgress.vue'

export interface ConfirmStep {
  label: string
  status: 'pending' | 'loading' | 'success' | 'error'
  errorMessage?: string
}

const props = defineProps<{
  modelValue: boolean
  steps: ConfirmStep[]
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isLoading = computed(() => props.steps.some((s) => s.status === 'loading'))
const allSuccess = computed(() => props.steps.every((s) => s.status === 'success'))

const canDismiss = computed(() => {
  if (isLoading.value) return false
  return allSuccess.value || props.steps.some((s) => s.status === 'error')
})

const progressValue = computed(() => {
  if (props.steps.length === 0) return 0
  const completed = props.steps.filter((s) => s.status === 'success').length
  return completed / props.steps.length
})

const progressColor = computed(() => {
  if (props.steps.some((s) => s.status === 'error')) return 'negative'
  return 'primary'
})

function stepCircleClass(status: ConfirmStep['status']) {
  return {
    'step-circle--pending': status === 'pending',
    'step-circle--loading': status === 'loading',
    'step-circle--success': status === 'success',
    'step-circle--error': status === 'error',
  }
}
</script>

<style scoped>
:deep(.q-card > .q-card-section:first-child) {
  padding: 14px 16px;
}

.confirm-progress {
  padding: 4px 0;
}

.steps-container {
  display: flex;
  flex-direction: column;
}

.step-row {
  display: flex;
  align-items: flex-start;
  animation: slideInUp 0.3s ease both;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 14px;
  flex-shrink: 0;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-circle--pending {
  background: #f0f4f8;
  border: 2px solid #cfd8dc;
}

.step-circle--loading {
  background: #1976D2;
  border: 2px solid #1976D2;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.2);
  animation: pulse-ring 1.5s ease-in-out infinite;
}

.step-circle--success {
  background: #1976D2;
  border: 2px solid #1976D2;
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.step-circle--error {
  background: #C10015;
  border: 2px solid #C10015;
}

.step-connector {
  width: 2px;
  height: 24px;
  background: #cfd8dc;
  margin: 4px 0;
}

.step-connector--done {
  background: #1976D2;
}

.step-connector--error {
  background: #C10015;
}

.step-content {
  padding: 5px 0 20px;
  min-height: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step-row:last-child .step-content {
  padding-bottom: 0;
}

.step-label {
  font-size: 14px;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.step-error {
  font-size: 12px;
  color: #C10015;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(193, 0, 21, 0.08);
  border-radius: 4px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(25, 118, 210, 0.08);
  border-radius: 8px;
  animation: slideInUp 0.3s ease both;
}

.loading-dots::after {
  content: '';
  animation: dots 1.2s steps(4) infinite;
}

/* Transitions */
.step-icon-enter-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.step-icon-leave-active {
  transition: all 0.15s ease;
}

.step-icon-enter-from {
  opacity: 0;
  transform: scale(0.4);
}

.step-icon-leave-to {
  opacity: 0;
  transform: scale(1.3);
}

.fade-slide-enter-active {
  transition: all 0.3s ease;
}

.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.success-pop {
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Keyframes */
@keyframes pulse-ring {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(25, 118, 210, 0.05);
  }
}

@keyframes pop-in {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}
</style>

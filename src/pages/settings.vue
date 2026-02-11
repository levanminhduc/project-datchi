<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Cài đặt hệ thống
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Quản lý các cài đặt chung cho hệ thống
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !hasLoaded"
      class="row justify-center q-py-xl"
    >
      <q-spinner-dots
        size="50px"
        color="primary"
      />
    </div>

    <!-- Settings Form -->
    <q-card
      v-else
      flat
      bordered
      class="settings-card"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt xuất kho
        </div>

        <!-- Partial Cone Ratio Setting -->
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-6 col-lg-4">
            <AppInput
              v-model.number="partialConeRatio"
              label="Tỷ lệ quy đổi cuộn lẻ"
              type="number"
              step="0.1"
              min="0"
              max="1"
              hint="Giá trị từ 0 đến 1 (ví dụ: 0.3 = 30%)"
              :disable="isLoading"
              outlined
              dense
            >
              <template #prepend>
                <q-icon name="percent" />
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-md-auto">
            <AppButton
              label="Lưu thay đổi"
              color="primary"
              icon="save"
              :loading="isLoading"
              :disable="!hasChanges"
              @click="handleSave"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="q-mt-md text-caption text-grey-7">
          <q-icon
            name="info"
            size="xs"
            class="q-mr-xs"
          />
          Tỷ lệ quy đổi cuộn lẻ được sử dụng để tính toán số lượng cuộn lẻ khi xuất kho sản xuất.
          Giá trị mặc định là 0.3 (tương đương 30% cuộn nguyên).
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettings } from '@/composables/useSettings'

// Setting key constant
const PARTIAL_CONE_RATIO_KEY = 'partial_cone_ratio'

// Composables
const { isLoading, getSetting, updateSetting } = useSettings()

// State
const partialConeRatio = ref<number>(0.5)
const originalValue = ref<number>(0.5)
const hasLoaded = ref(false)

// Computed
const hasChanges = computed(() => {
  return partialConeRatio.value !== originalValue.value
})

// Actions
async function loadSettings() {
  const setting = await getSetting(PARTIAL_CONE_RATIO_KEY)
  if (setting) {
    const value = typeof setting.value === 'number' ? setting.value : parseFloat(String(setting.value))
    partialConeRatio.value = isNaN(value) ? 0.5 : value
    originalValue.value = partialConeRatio.value
  }
  hasLoaded.value = true
}

async function handleSave() {
  const result = await updateSetting(PARTIAL_CONE_RATIO_KEY, partialConeRatio.value)
  if (result) {
    originalValue.value = partialConeRatio.value
  }
}

// Lifecycle
onMounted(async () => {
  await loadSettings()
})
</script>

<style scoped>
.settings-card {
  max-width: 800px;
}
</style>

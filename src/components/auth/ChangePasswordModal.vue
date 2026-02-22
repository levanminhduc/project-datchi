<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { QForm } from 'quasar'

interface Props {
  modelValue?: boolean
  currentPassword?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentPassword: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  changed: []
}>()

const { changePassword } = useAuth()

const formRef = ref<QForm>()
const loading = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  required: (val: string) => !!val || 'Trường này là bắt buộc',
  minLength: (val: string) => !val || val.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
  confirmMatch: (val: string) => val === form.newPassword || 'Mật khẩu xác nhận không khớp',
}

function resetForm() {
  form.newPassword = ''
  form.confirmPassword = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  formRef.value?.resetValidation()
}

watch(() => props.modelValue, (val) => {
  if (val) resetForm()
})

async function onSubmit() {
  loading.value = true
  const success = await changePassword({
    currentPassword: props.currentPassword || '',
    newPassword: form.newPassword,
    confirmPassword: form.confirmPassword,
  })

  if (success) {
    emit('update:modelValue', false)
    emit('changed')
  }
  loading.value = false
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    no-esc-dismiss
    no-backdrop-dismiss
  >
    <q-card style="max-width: 500px; width: 100%">
      <q-form ref="formRef" @submit.prevent="onSubmit">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Đổi mật khẩu
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md q-gutter-md">
          <q-banner class="bg-warning text-white" rounded>
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.
          </q-banner>

          <q-input
            v-model="form.newPassword"
            label="Mật khẩu mới"
            :type="showNewPassword ? 'text' : 'password'"
            outlined
            lazy-rules
            :rules="[rules.required, rules.minLength]"
            autocomplete="new-password"
          >
            <template #prepend>
              <q-icon name="lock_reset" />
            </template>
            <template #append>
              <q-icon
                :name="showNewPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="form.confirmPassword"
            label="Xác nhận mật khẩu mới"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            lazy-rules
            :rules="[rules.required, rules.confirmMatch]"
            autocomplete="new-password"
          >
            <template #prepend>
              <q-icon name="lock_reset" />
            </template>
            <template #append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="text-primary q-pa-md">
          <q-btn
            unelevated
            type="submit"
            label="Đổi mật khẩu"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

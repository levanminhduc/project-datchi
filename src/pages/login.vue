<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card
      class="login-card q-pa-lg"
      style="width: 400px; max-width: 90vw"
    >
      <!-- Logo & Title -->
      <div class="text-center q-mb-lg">
        <q-icon
          name="inventory_2"
          size="64px"
          color="primary"
        />
        <h1 class="text-h5 q-mt-md q-mb-none">
          Quản lý Kho Chỉ
        </h1>
        <p class="text-grey-7">
          Đăng nhập để tiếp tục
        </p>
      </div>

      <!-- Login Form -->
      <q-form
        class="q-gutter-md"
        @submit="handleLogin"
      >
        <AppInput
          v-model="form.employeeId"
          label="Mã Nhân Viên"
          prepend-icon="badge"
          :rules="[required]"
          autocomplete="username"
          hint="Ví dụ: NV001"
        />

        <q-input
          v-model="form.password"
          label="Mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          outlined
          lazy-rules
          :rules="[required]"
          autocomplete="current-password"
        >
          <template #prepend>
            <q-icon name="lock" />
          </template>
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div class="row items-center justify-between">
          <q-checkbox
            v-model="rememberMe"
            label="Ghi nhớ đăng nhập"
            dense
          />
          <!-- Note: Forgot password requires admin reset for employee-based auth -->
        </div>

        <AppButton
          type="submit"
          label="Đăng nhập"
          color="primary"
          :loading="isLoading"
          class="full-width"
          size="lg"
        />
      </q-form>

      <!-- Error Display -->
      <q-banner
        v-if="authError"
        class="q-mt-md bg-negative text-white"
        rounded
      >
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ authError }}
      </q-banner>

      <!-- Help Text -->
      <div class="text-center q-mt-md text-grey-6 text-caption">
        Quên mật khẩu? Liên hệ quản trị viên để đặt lại.
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

definePage({
  meta: {
    public: true, // Public route - no auth required
    title: 'Đăng nhập',
  },
})

const router = useRouter()
const route = useRoute()
const { signIn, isLoading, error: authError } = useAuth()

const form = reactive({
  employeeId: '',
  password: '',
})

const showPassword = ref(false)
const rememberMe = ref(true)

// Validation rules
const required = (val: string) => !!val || 'Trường này là bắt buộc'

async function handleLogin() {
  const success = await signIn({
    employeeId: form.employeeId,
    password: form.password,
  })

  if (success) {
    // Redirect to intended page or home
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  }
}
</script>

<style scoped lang="scss">
.login-card {
  border-radius: 12px;
}
</style>

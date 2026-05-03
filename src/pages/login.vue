<template>
  <q-page class="login-page flex flex-center">
    <q-card
      class="login-card q-pa-xl"
      flat
      bordered
    >
      <div class="text-center q-mb-lg">
        <div class="login-logo q-mb-md">
          <q-icon
            name="inventory_2"
            size="40px"
            color="white"
          />
        </div>
        <h1 class="text-h5 q-mb-xs text-weight-bold">
          Quản lý Kho Chỉ
        </h1>
        <p class="text-grey-7 q-mb-none text-body2">
          Đăng nhập để tiếp tục
        </p>
      </div>

      <q-form
        class="q-gutter-md"
        @submit="handleLogin"
      >
        <AppInput
          id="username"
          v-model="form.employeeId"
          name="username"
          label="Mã Nhân Viên"
          prepend-icon="badge"
          :rules="[required]"
          autocomplete="username"
          hint="Ví dụ: NV001"
        />

        <AppInput
          id="password"
          v-model="form.password"
          name="password"
          label="Mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          prepend-icon="lock"
          :rules="[required]"
          autocomplete="current-password"
        >
          <template #append>
            <q-btn
              flat
              dense
              round
              size="sm"
              :icon="showPassword ? 'visibility_off' : 'visibility'"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              @click="showPassword = !showPassword"
            />
          </template>
        </AppInput>

        <div class="row items-center justify-between">
          <AppCheckbox
            v-model="rememberMe"
            label="Ghi nhớ đăng nhập"
            dense
          />
        </div>

        <div>
          <AppButton
            type="submit"
            label="Đăng nhập"
            color="primary"
            :loading="isLoading"
            block
          />
        </div>
      </q-form>

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

      <div class="text-center q-mt-lg text-grey-6 text-caption">
        Quên mật khẩu? Liên hệ IT để cấp lại mật khẩu.
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'

definePage({
  meta: {
    public: true,
    title: 'Đăng nhập',
  },
})

const REMEMBERED_EMPLOYEE_ID_KEY = 'datchi-remembered-employee-id'

const router = useRouter()
const route = useRoute()
const { signIn, isLoading, error: authError } = useAuth()

const rememberedEmployeeId = (() => {
  try {
    return localStorage.getItem(REMEMBERED_EMPLOYEE_ID_KEY) || ''
  } catch {
    return ''
  }
})()

const form = reactive({
  employeeId: rememberedEmployeeId,
  password: '',
})

const showPassword = ref(false)
const rememberMe = ref(true)

const required = (val: string) => !!val || 'Trường này là bắt buộc'

function persistRememberMe() {
  try {
    if (rememberMe.value) {
      localStorage.setItem(REMEMBERED_EMPLOYEE_ID_KEY, form.employeeId.trim())
    } else {
      localStorage.removeItem(REMEMBERED_EMPLOYEE_ID_KEY)
    }
  } catch { /* quota */ }
}

async function handleLogin() {
  persistRememberMe()

  const success = await signIn({
    employeeId: form.employeeId,
    password: form.password,
  })

  if (success) {
    const redirect = route.query.redirect as string
    router.push(redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/')
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f7fb 50%, #e8f0fe 100%);
}

.login-card {
  width: 420px;
  max-width: 92vw;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(20, 30, 80, 0.08), 0 4px 14px rgba(20, 30, 80, 0.04);
}

.login-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--q-primary), #4f7df3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(31, 81, 255, 0.25);
}

:global(.body--dark) .login-page {
  background: linear-gradient(135deg, #1a1f2e 0%, #121826 50%, #0f1422 100%);
}

:global(.body--dark) .login-card {
  background: #1c2333;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}
</style>

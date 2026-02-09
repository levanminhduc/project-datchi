<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card
      class="text-center q-pa-xl"
      style="max-width: 500px"
    >
      <q-icon
        name="lock"
        size="80px"
        color="negative"
      />
      
      <h1 class="text-h4 q-mt-lg q-mb-sm">
        Truy Cập Bị Từ Chối
      </h1>
      
      <p class="text-grey-7 q-mb-lg">
        Bạn không có quyền truy cập trang này.
        <br>
        Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
      </p>

      <div class="q-gutter-md">
        <q-btn
          color="primary"
          icon="home"
          label="Về Trang Chủ"
          @click="router.push('/')"
        />
        <q-btn
          flat
          color="grey-7"
          icon="arrow_back"
          label="Quay Lại"
          @click="router.back()"
        />
      </div>

      <!-- Show current user info if authenticated -->
      <div
        v-if="employee"
        class="q-mt-xl text-caption text-grey-6"
      >
        <q-icon
          name="person"
          size="xs"
          class="q-mr-xs"
        />
        Đang đăng nhập: {{ employee.fullName }} ({{ employee.employeeId }})
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

definePage({
  meta: {
    // This page requires auth to show who is logged in
    // But accessible to all authenticated users
    title: 'Truy Cập Bị Từ Chối',
  },
})

const router = useRouter()
const { employee } = useAuth()
</script>

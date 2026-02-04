<template>
  <q-btn
    v-if="isAuthenticated"
    flat
    round
    dense
    icon="account_circle"
  >
    <q-tooltip>{{ employee?.fullName || 'Tài khoản' }}</q-tooltip>
    <q-menu>
      <q-list style="min-width: 200px">
        <q-item-label header class="text-weight-bold">
          Thông tin tài khoản
        </q-item-label>
        
        <q-item>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="40px">
              {{ avatarInitials }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ employee?.fullName || 'N/A' }}</q-item-label>
            <q-item-label caption>{{ employee?.employeeId || '' }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          v-close-popup
          @click="handleLogout"
        >
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">Đăng xuất</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { employee, isAuthenticated, signOut } = useAuth()

const avatarInitials = computed(() => {
  const name = employee.value?.fullName || ''
  if (!name) return '?'
  
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    // Vietnamese: last word is first name, first word is family name
    const firstChar = parts[0]?.[0] || ''
    const lastChar = parts[parts.length - 1]?.[0] || ''
    return (firstChar + lastChar).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

async function handleLogout() {
  await signOut()
}
</script>

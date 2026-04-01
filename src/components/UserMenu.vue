<template>
  <q-btn
    v-if="isAuthenticated"
    flat
    dense
    no-caps
    class="user-menu-btn"
  >
    <div class="row items-center no-wrap q-gutter-x-xs">
      <q-icon
        name="account_circle"
        size="28px"
      />
      <span class="greeting-text gt-xs">Xin chào, {{ employee?.fullName || 'Tài khoản' }}</span>
    </div>
    <q-tooltip>{{ employee?.fullName || 'Tài khoản' }}</q-tooltip>
    <q-menu>
      <q-list style="min-width: 200px">
        <q-item-label
          header
          class="text-weight-bold"
        >
          Thông tin tài khoản
        </q-item-label>
        
        <q-item>
          <q-item-section avatar>
            <q-avatar
              color="primary"
              text-color="white"
              size="40px"
            >
              {{ avatarInitials }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ employee?.fullName || 'N/A' }}</q-item-label>
            <q-item-label caption>
              {{ employee?.employeeId || '' }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <template v-if="isPublicPage">
          <q-item
            v-close-popup
            clickable
            to="/"
          >
            <q-item-section avatar>
              <q-icon
                name="dashboard"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Bảng điều khiển</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            v-close-popup
            clickable
            to="/guides"
          >
            <q-item-section avatar>
              <q-icon
                name="menu_book"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Bài Viết</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />
        </template>

        <q-item
          v-close-popup
          clickable
          @click="handleLogout"
        >
          <q-item-section avatar>
            <q-icon
              name="logout"
              color="negative"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">
              Đăng xuất
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { employee, isAuthenticated, signOut } = useAuth()

const isPublicPage = computed(() => route.path.startsWith('/g/'))

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

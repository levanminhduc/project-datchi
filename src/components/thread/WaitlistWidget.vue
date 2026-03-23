<template>
  <q-card
    v-bind="$attrs"
    bordered
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-icon
            name="hourglass_empty"
            color="orange"
            size="24px"
          />
          <span class="text-h6">Danh sách chờ</span>
        </div>
        <q-badge
          v-if="waitlistCount > 0"
          color="orange"
          :label="waitlistCount"
          rounded
        />
      </div>

      <!-- Empty State -->
      <div
        v-if="waitlistCount === 0"
        class="text-center q-py-md"
      >
        <q-icon
          name="playlist_add_check"
          color="positive"
          size="48px"
        />
        <div class="text-subtitle2 text-grey q-mt-sm">
          Không có yêu cầu chờ
        </div>
      </div>

      <!-- Waitlist Items -->
      <q-list
        v-else
        separator
        dense
      >
        <q-item
          v-for="item in waitlistItems"
          :key="item.id"
          clickable
          @click="viewWaitlistItem(item)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="getWaitTimeColor(item.waitingDays)"
              text-color="white"
              size="32px"
            >
              <span class="text-caption text-weight-bold">
                {{ item.waitingDays }}d
              </span>
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.threadType }}</q-item-label>
            <q-item-label caption>
              {{ item.requestedQuantity }}m yêu cầu
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-item-label
              caption
              class="text-grey"
            >
              {{ formatWaitingTime(item.createdAt) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- View All Link -->
    <template v-if="waitlistCount > 5">
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          color="primary"
          label="Xem tất cả"
          icon-right="arrow_forward"
          @click="$router.push('/thread/allocations?tab=waitlist')"
        />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '@/composables/thread/useDashboard'

const router = useRouter()

// Props
interface Props {
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoFetch: true,
})

// Types
interface WaitlistItem {
  id: number
  threadType: string
  threadTypeId: number
  requestedQuantity: number
  createdAt: string
  waitingDays: number
}

// Composables
const { pending, fetchPending } = useDashboard()

// Local state
const waitlistItems = ref<WaitlistItem[]>([])

// Computed
const waitlistCount = computed(() => pending.value?.waitlisted_allocations || 0)

// Methods
const getWaitTimeColor = (days: number): string => {
  if (days >= 7) return 'negative'
  if (days >= 3) return 'warning'
  return 'info'
}

const formatWaitingTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Vừa thêm'
  if (diffHours < 24) return `${diffHours} giờ`
  if (diffDays === 1) return '1 ngày'
  return `${diffDays} ngày`
}

const viewWaitlistItem = (item: WaitlistItem) => {
  router.push({
    path: '/thread/allocations',
    query: { waitlist_id: item.id.toString() },
  })
}

const generateMockWaitlist = () => {
  const count = waitlistCount.value
  if (count === 0) {
    waitlistItems.value = []
    return
  }

  // Generate mock data (in real app, would come from API)
  const mockThreadTypes = ['Chỉ cotton đỏ', 'Chỉ polyester xanh', 'Chỉ nylon trắng', 'Chỉ lụa vàng', 'Chỉ len nâu']
  
  waitlistItems.value = Array.from({ length: Math.min(count, 5) }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 10) + 1
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - daysAgo)

    return {
      id: i + 1,
      threadType: mockThreadTypes[i % mockThreadTypes.length] as string,
      threadTypeId: i + 1,
      requestedQuantity: Math.floor(Math.random() * 500) + 100,
      createdAt: createdAt.toISOString(),
      waitingDays: daysAgo,
    }
  }).sort((a, b) => b.waitingDays - a.waitingDays)
}

// Lifecycle
onMounted(async () => {
  if (props.autoFetch) {
    await fetchPending()
    generateMockWaitlist()
  }
})
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Thông báo ngoài
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Cấu hình gửi thông báo qua Telegram khi có sự kiện quan trọng
        </p>
      </div>
    </div>

    <div
      v-if="isLoading && !hasLoaded"
      class="row justify-center q-py-xl"
    >
      <q-spinner-dots
        size="50px"
        color="primary"
      />
    </div>

    <template v-else>
      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Telegram Group
          </div>

          <div
            v-if="groups.length === 0"
            class="q-mb-md"
          >
            <div class="text-body2 text-grey-7 q-mb-sm">
              Chưa có group nào. Thêm group để nhận thông báo chung.
            </div>
          </div>

          <div
            v-for="group in groups"
            :key="group.id"
            class="row q-col-gutter-sm items-center q-mb-sm"
          >
            <div class="col-auto">
              <q-toggle
                :model-value="group.is_active"
                color="positive"
                @update:model-value="toggleChannel(group.id, true)"
              />
            </div>
            <div class="col">
              <span class="text-body2">
                {{ group.channel_config.name || group.channel_config.chat_id }}
              </span>
              <span class="text-caption text-grey-6 q-ml-sm">
                ({{ group.channel_config.chat_id }})
              </span>
            </div>
            <div class="col-auto">
              <q-btn
                icon="send"
                size="sm"
                flat
                color="primary"
                :loading="isTesting"
                @click="testMessage('TELEGRAM', group.channel_config.chat_id)"
              />
              <q-btn
                icon="delete"
                size="sm"
                flat
                color="negative"
                @click="removeChannel(group.id, true)"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="text-body2 text-weight-medium q-mb-sm">
            Thêm group mới
          </div>
          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-md-4">
              <AppInput
                v-model="newGroupChatId"
                label="Group Chat ID"
                hint="VD: -1001234567890"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-3">
              <AppInput
                v-model="newGroupName"
                label="Tên nhóm (tùy chọn)"
                outlined
                dense
              />
            </div>
            <div class="col-auto">
              <AppButton
                label="Thêm"
                color="primary"
                icon="add"
                :disable="!newGroupChatId.trim()"
                @click="handleAddGroup"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-subtitle1 text-weight-medium">
                Người vừa gửi /id
              </div>
              <div class="text-caption text-grey-7">
                Chọn Telegram ID để gán vào nhân viên hoặc lãnh đạo duyệt đơn
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                icon="refresh"
                size="sm"
                flat
                round
                color="primary"
                :loading="isLoadingIdentities"
                @click="loadTelegramIdentities"
              />
            </div>
          </div>

          <q-markup-table
            v-if="telegramIdentities.length > 0"
            flat
            bordered
            separator="horizontal"
          >
            <thead>
              <tr>
                <th class="text-left">
                  Telegram
                </th>
                <th class="text-left">
                  Chat ID
                </th>
                <th class="text-left">
                  User ID
                </th>
                <th class="text-left">
                  Gửi lần cuối
                </th>
                <th class="text-left">
                  Trạng thái
                </th>
                <th class="text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="identity in telegramIdentities"
                :key="identity.id"
              >
                <td>
                  <div>{{ formatTelegramName(identity) }}</div>
                  <div class="text-caption text-grey-6">
                    {{ identity.username ? `@${identity.username}` : 'Không có username' }}
                  </div>
                </td>
                <td>{{ identity.chat_id }}</td>
                <td>{{ identity.telegram_user_id }}</td>
                <td>{{ formatDateTime(identity.last_seen_at) }}</td>
                <td>
                  <q-badge
                    v-if="identity.assigned_employee"
                    color="positive"
                  >
                    {{ identity.assigned_employee.employee_id }}
                  </q-badge>
                  <q-badge
                    v-else
                    color="grey"
                  >
                    Chưa gán
                  </q-badge>
                </td>
                <td class="text-center">
                  <q-btn
                    icon="link"
                    size="sm"
                    flat
                    color="primary"
                    @click="openAssignDialog(identity)"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <div
            v-else
            class="text-body2 text-grey-7"
          >
            Chưa có ai gửi /id cho bot.
          </div>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Lãnh đạo duyệt đơn qua Telegram
          </div>

          <q-markup-table
            v-if="approvalChannels.length > 0"
            flat
            bordered
            separator="horizontal"
            class="q-mb-md"
          >
            <thead>
              <tr>
                <th class="text-left">
                  Lãnh đạo
                </th>
                <th class="text-left">
                  Chat ID
                </th>
                <th class="text-left">
                  Telegram User ID
                </th>
                <th class="text-center">
                  Trạng thái
                </th>
                <th class="text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ch in approvalChannels"
                :key="ch.id"
              >
                <td>
                  <div>{{ ch.employees?.full_name || `#${ch.employee_id}` }}</div>
                  <div class="text-caption text-grey-6">
                    {{ ch.employees?.employee_id || '' }}
                  </div>
                </td>
                <td>{{ ch.channel_config.chat_id }}</td>
                <td>{{ ch.channel_config.telegram_user_id || '—' }}</td>
                <td class="text-center">
                  <q-toggle
                    :model-value="ch.is_active"
                    color="positive"
                    dense
                    @update:model-value="toggleChannel(ch.id)"
                  />
                </td>
                <td class="text-center">
                  <q-btn
                    icon="send"
                    size="sm"
                    flat
                    color="primary"
                    :loading="isTesting"
                    @click="testMessage('TELEGRAM', ch.channel_config.chat_id)"
                  />
                  <q-btn
                    icon="delete"
                    size="sm"
                    flat
                    color="negative"
                    @click="removeChannel(ch.id)"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <div
            v-else
            class="text-body2 text-grey-7 q-mb-md"
          >
            Chưa có lãnh đạo duyệt đơn qua Telegram.
          </div>

          <q-separator class="q-my-md" />

          <div class="text-body2 text-weight-medium q-mb-sm">
            Thêm lãnh đạo duyệt đơn
          </div>
          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-md-4">
              <AppSelect
                v-model="newLeaderEmployeeId"
                label="Lãnh đạo"
                :options="leaderOptions"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-3">
              <AppInput
                v-model="newLeaderChatId"
                label="Telegram Chat ID"
                hint="Bot trả về khi lãnh đạo gửi /id"
                outlined
                dense
                :error-message="newLeaderChatId.length > 0 && !isLeaderChatIdValid ? 'Telegram Chat ID phải là số dương' : ''"
              />
            </div>
            <div class="col-12 col-md-3">
              <AppInput
                v-model="newLeaderTelegramUserId"
                label="Telegram User ID"
                hint="Dùng để xác thực nút duyệt"
                outlined
                dense
                :error-message="newLeaderTelegramUserId.length > 0 && !isLeaderTelegramUserIdValid ? 'Telegram User ID phải là số dương' : ''"
              />
            </div>
            <div class="col-auto">
              <AppButton
                label="Thêm"
                color="primary"
                icon="add"
                :disable="!newLeaderEmployeeId || !isLeaderChatIdValid || !isLeaderTelegramUserIdValid"
                @click="handleAddLeaderChannel"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Người nhận tin riêng
          </div>

          <q-markup-table
            v-if="regularChannels.length > 0"
            flat
            bordered
            separator="horizontal"
            class="q-mb-md"
          >
            <thead>
              <tr>
                <th class="text-left">
                  Nhân viên
                </th>
                <th class="text-left">
                  Chat ID
                </th>
                <th class="text-left">
                  Sự kiện
                </th>
                <th class="text-center">
                  Trạng thái
                </th>
                <th class="text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ch in regularChannels"
                :key="ch.id"
              >
                <td>{{ ch.employees?.full_name || `#${ch.employee_id}` }}</td>
                <td>{{ ch.channel_config.chat_id }}</td>
                <td>
                  <q-badge
                    v-for="evt in ch.event_types"
                    :key="evt"
                    color="primary"
                    class="q-mr-xs"
                  >
                    {{ eventLabels[evt] || evt }}
                  </q-badge>
                </td>
                <td class="text-center">
                  <q-toggle
                    :model-value="ch.is_active"
                    color="positive"
                    dense
                    @update:model-value="toggleChannel(ch.id)"
                  />
                </td>
                <td class="text-center">
                  <q-btn
                    icon="send"
                    size="sm"
                    flat
                    color="primary"
                    :loading="isTesting"
                    @click="testMessage('TELEGRAM', ch.channel_config.chat_id)"
                  />
                  <q-btn
                    icon="delete"
                    size="sm"
                    flat
                    color="negative"
                    @click="removeChannel(ch.id)"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <div
            v-else
            class="text-body2 text-grey-7 q-mb-md"
          >
            Chưa có người nhận. Thêm nhân viên để nhận thông báo riêng qua Telegram.
          </div>

          <q-separator class="q-my-md" />

          <div class="text-body2 text-weight-medium q-mb-sm">
            Thêm người nhận
          </div>
          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-md-3">
              <AppSelect
                v-model="newEmployeeId"
                label="Nhân viên"
                :options="employeeOptions"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-3">
              <AppInput
                v-model="newChatId"
                label="Telegram Chat ID"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-3">
              <AppSelect
                v-model="newEventTypes"
                label="Sự kiện"
                :options="eventOptions"
                multiple
                outlined
                dense
              />
            </div>
            <div class="col-auto">
              <AppButton
                label="Thêm"
                color="primary"
                icon="add"
                :disable="!newEmployeeId || !newChatId.trim() || newEventTypes.length === 0"
                @click="handleAddChannel"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
      >
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Hướng dẫn lấy Telegram Chat ID
          </div>
          <ol class="q-pl-md text-body2">
            <li class="q-mb-xs">
              Tìm bot trên Telegram (liên hệ admin để biết tên bot)
            </li>
            <li class="q-mb-xs">
              Gửi lệnh <code>/start</code> cho bot
            </li>
            <li class="q-mb-xs">
              Bot sẽ trả về Chat ID và Telegram User ID — dùng cho cấu hình nhận tin riêng hoặc lãnh đạo duyệt đơn
            </li>
            <li class="q-mb-xs">
              Với group: thêm bot vào group → gửi tin nhắn bất kỳ → Chat ID sẽ là số âm (VD: -1001234567890)
            </li>
          </ol>
        </q-card-section>
      </q-card>
    </template>

    <q-dialog v-model="assignDialogOpen">
      <q-card style="width: 560px; max-width: 92vw;">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            Gán Telegram ID
          </div>
          <div
            v-if="selectedTelegramIdentity"
            class="text-caption text-grey-7"
          >
            {{ formatTelegramName(selectedTelegramIdentity) }} · {{ selectedTelegramIdentity.chat_id }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <AppSelect
            v-model="assignMode"
            label="Loại gán"
            :options="assignModeOptions"
            outlined
            dense
          />

          <AppSelect
            v-model="assignEmployeeId"
            :label="assignMode === 'APPROVAL' ? 'Lãnh đạo' : 'Nhân viên'"
            :options="assignEmployeeOptions"
            outlined
            dense
          />

          <AppSelect
            v-if="assignMode === 'REGULAR'"
            v-model="assignEventTypes"
            label="Sự kiện"
            :options="eventOptions"
            multiple
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Hủy"
            color="grey-7"
            v-close-popup
          />
          <AppButton
            label="Gán"
            color="primary"
            icon="link"
            :loading="isAssigningIdentity"
            :disable="!canAssignIdentity"
            @click="handleAssignIdentity"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useNotificationChannels } from '@/composables/use-notification-channels'
import { useSnackbar } from '@/composables/useSnackbar'
import { fetchApi } from '@/services/api'
import { notificationChannelService } from '@/services/notification-channel-service'
import { EVENT_TYPE_LABELS } from '@/types/notification-channel'
import type {
  ExternalEventType,
  TelegramIdentity,
  TelegramIdentityAssignMode,
} from '@/types/notification-channel'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

const {
  channels,
  groups,
  isLoading,
  isTesting,
  loadAll,
  createChannel,
  createGroup,
  toggleChannel,
  removeChannel,
  testMessage,
} = useNotificationChannels()
const snackbar = useSnackbar()

const hasLoaded = ref(false)
const eventLabels = EVENT_TYPE_LABELS

const newGroupChatId = ref('')
const newGroupName = ref('')
const newEmployeeId = ref<number | null>(null)
const newChatId = ref('')
const newEventTypes = ref<ExternalEventType[]>(['ORDER_CONFIRMED'])
const newLeaderEmployeeId = ref<number | null>(null)
const newLeaderChatId = ref('')
const newLeaderTelegramUserId = ref('')

const employeeOptions = ref<Array<{ label: string; value: number }>>([])
const leaderOptions = ref<Array<{ label: string; value: number }>>([])
const telegramIdentities = ref<TelegramIdentity[]>([])
const isLoadingIdentities = ref(false)
const isAssigningIdentity = ref(false)
const assignDialogOpen = ref(false)
const selectedTelegramIdentity = ref<TelegramIdentity | null>(null)
const assignMode = ref<TelegramIdentityAssignMode>('REGULAR')
const assignEmployeeId = ref<number | null>(null)
const assignEventTypes = ref<ExternalEventType[]>(['ORDER_CONFIRMED'])
const regularChannels = computed(() =>
  channels.value.filter(ch => !ch.event_types.includes('ORDER_APPROVAL_REQUESTED'))
)
const approvalChannels = computed(() =>
  channels.value.filter(ch => ch.event_types.includes('ORDER_APPROVAL_REQUESTED'))
)
const eventOptions = Object.entries(EVENT_TYPE_LABELS)
  .filter(([value]) => value !== 'ORDER_APPROVAL_REQUESTED')
  .map(([value, label]) => ({
    label,
    value,
  }))
const assignModeOptions = [
  { label: 'Người nhận tin riêng', value: 'REGULAR' },
  { label: 'Lãnh đạo duyệt đơn', value: 'APPROVAL' },
]
const assignEmployeeOptions = computed(() =>
  assignMode.value === 'APPROVAL' ? leaderOptions.value : employeeOptions.value
)
const canAssignIdentity = computed(() =>
  !!selectedTelegramIdentity.value &&
  !!assignEmployeeId.value &&
  (assignMode.value === 'APPROVAL' || assignEventTypes.value.length > 0)
)

const isLeaderTelegramUserIdValid = computed(() =>
  /^[1-9]\d*$/.test(newLeaderTelegramUserId.value.trim())
)
const isLeaderChatIdValid = computed(() =>
  /^[1-9]\d*$/.test(newLeaderChatId.value.trim())
)

async function loadEmployees() {
  try {
    const res = await fetchApi<{ data: Array<{ id: number; employee_id: string; full_name: string }> }>(
      '/api/employees?limit=500&is_active=true',
    )
    const list = res.data || []
    employeeOptions.value = list.map((e) => ({
      label: `${e.employee_id} — ${e.full_name}`,
      value: e.id,
    }))
  } catch {
    employeeOptions.value = []
  }
}

async function loadLeaderCandidates() {
  try {
    const list = await notificationChannelService.listLeaderCandidates()
    leaderOptions.value = list.map((e) => ({
      label: `${e.employee_id} — ${e.full_name}${e.chuc_vu ? ` (${e.chuc_vu})` : ''}`,
      value: e.id,
    }))
  } catch {
    leaderOptions.value = []
  }
}

async function loadTelegramIdentities() {
  isLoadingIdentities.value = true
  try {
    telegramIdentities.value = await notificationChannelService.listTelegramIdentities('all')
  } catch {
    telegramIdentities.value = []
    snackbar.error('Lỗi khi tải Telegram ID')
  } finally {
    isLoadingIdentities.value = false
  }
}

function formatTelegramName(identity: TelegramIdentity) {
  const fullName = [identity.first_name, identity.last_name].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (identity.username) return `@${identity.username}`
  return `Telegram #${identity.telegram_user_id}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function openAssignDialog(identity: TelegramIdentity) {
  selectedTelegramIdentity.value = identity
  assignMode.value = 'REGULAR'
  assignEmployeeId.value = identity.assigned_employee_id
  assignEventTypes.value = ['ORDER_CONFIRMED']
  assignDialogOpen.value = true
}

async function handleAssignIdentity() {
  if (!selectedTelegramIdentity.value || !assignEmployeeId.value || !canAssignIdentity.value) return

  isAssigningIdentity.value = true
  try {
    await notificationChannelService.assignTelegramIdentity(selectedTelegramIdentity.value.id, {
      employee_id: assignEmployeeId.value,
      mode: assignMode.value,
      event_types: assignMode.value === 'REGULAR' ? assignEventTypes.value : undefined,
    })
    assignDialogOpen.value = false
    selectedTelegramIdentity.value = null
    snackbar.success('Đã gán Telegram ID')
    await Promise.all([loadAll(), loadTelegramIdentities()])
  } catch {
    snackbar.error('Lỗi khi gán Telegram ID')
  } finally {
    isAssigningIdentity.value = false
  }
}

async function handleAddGroup() {
  const ok = await createGroup({
    channel_type: 'TELEGRAM',
    channel_config: {
      chat_id: newGroupChatId.value.trim(),
      name: newGroupName.value.trim() || undefined,
    },
    event_types: ['ORDER_CONFIRMED'],
  })
  if (ok) {
    newGroupChatId.value = ''
    newGroupName.value = ''
  }
}

async function handleAddLeaderChannel() {
  if (!newLeaderEmployeeId.value || !isLeaderChatIdValid.value || !isLeaderTelegramUserIdValid.value) return

  const ok = await createChannel({
    employee_id: newLeaderEmployeeId.value,
    channel_type: 'TELEGRAM',
    channel_config: {
      chat_id: newLeaderChatId.value.trim(),
      telegram_user_id: newLeaderTelegramUserId.value.trim(),
    },
    event_types: ['ORDER_APPROVAL_REQUESTED'],
  })

  if (ok) {
    newLeaderEmployeeId.value = null
    newLeaderChatId.value = ''
    newLeaderTelegramUserId.value = ''
  }
}

async function handleAddChannel() {
  if (!newEmployeeId.value || !newChatId.value.trim()) return
  const ok = await createChannel({
    employee_id: newEmployeeId.value,
    channel_type: 'TELEGRAM',
    channel_config: { chat_id: newChatId.value.trim() },
    event_types: newEventTypes.value,
  })
  if (ok) {
    newEmployeeId.value = null
    newChatId.value = ''
    newEventTypes.value = ['ORDER_CONFIRMED']
  }
}

onMounted(async () => {
  await Promise.all([loadAll(), loadEmployees(), loadLeaderCandidates(), loadTelegramIdentities()])
  hasLoaded.value = true
})
</script>

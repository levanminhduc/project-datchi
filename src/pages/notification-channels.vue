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
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Người nhận tin riêng
          </div>

          <q-markup-table
            v-if="channels.length > 0"
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
                v-for="ch in channels"
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
              Bot sẽ trả về Chat ID của bạn — nhập vào ô Chat ID ở trên
            </li>
            <li class="q-mb-xs">
              Với group: thêm bot vào group → gửi tin nhắn bất kỳ → Chat ID sẽ là số âm (VD: -1001234567890)
            </li>
          </ol>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationChannels } from '@/composables/use-notification-channels'
import { fetchApi } from '@/services/api'
import { EVENT_TYPE_LABELS } from '@/types/notification-channel'
import type { ExternalEventType } from '@/types/notification-channel'
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

const hasLoaded = ref(false)
const eventLabels = EVENT_TYPE_LABELS

const newGroupChatId = ref('')
const newGroupName = ref('')
const newEmployeeId = ref<number | null>(null)
const newChatId = ref('')
const newEventTypes = ref<ExternalEventType[]>(['ORDER_CONFIRMED'])

const employeeOptions = ref<Array<{ label: string; value: number }>>([])
const eventOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}))

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
  await Promise.all([loadAll(), loadEmployees()])
  hasLoaded.value = true
})
</script>

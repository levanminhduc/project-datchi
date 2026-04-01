<script setup lang="ts">
import type { GuideListItem } from '@/types/guides'

interface Props {
  guide: GuideListItem
  isAdmin?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  click: []
  edit: []
  delete: []
  togglePublish: []
  share: []
}>()

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}
</script>

<template>
  <q-card
    class="guide-card cursor-pointer full-height"
    flat
    bordered
    @click="emit('click')"
  >
    <q-card-section class="col q-pt-sm">
      <div class="row no-wrap items-start">
        <div class="col">
          <div class="row items-center q-gutter-x-xs q-mb-xs">
            <span class="text-subtitle2 text-weight-medium guide-card__title">
              {{ guide.title }}
            </span>
            <q-badge
              v-if="isAdmin && guide.status === 'DRAFT'"
              color="orange"
              label="Nháp"
              class="q-ml-xs"
            />
          </div>
          <div
            v-if="guide.author_name"
            class="text-caption text-grey-7 q-mb-xs"
          >
            {{ guide.author_name }}
          </div>
          <div class="text-caption text-grey">
            {{ formatDate(guide.published_at || guide.created_at) }}
          </div>
        </div>
        <div
          class="guide-card__actions q-ml-sm"
          @click.stop
        >
          <IconButton
            v-if="guide.status === 'PUBLISHED'"
            icon="share"
            size="xs"
            tooltip="Chia sẻ"
            @click="emit('share')"
          />
          <template v-if="isAdmin">
            <IconButton
              icon="edit"
              size="xs"
              tooltip="Chỉnh sửa"
              @click="emit('edit')"
            />
            <IconButton
              :icon="guide.status === 'PUBLISHED' ? 'visibility_off' : 'visibility'"
              size="xs"
              :tooltip="guide.status === 'PUBLISHED' ? 'Ẩn bài' : 'Xuất bản'"
              @click="emit('togglePublish')"
            />
            <IconButton
              icon="delete"
              size="xs"
              color="negative"
              tooltip="Xóa"
              @click="emit('delete')"
            />
          </template>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.guide-card {
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
  &__title {
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}
</style>

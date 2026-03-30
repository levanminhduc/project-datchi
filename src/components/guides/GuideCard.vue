<script setup lang="ts">
import type { GuideListItem } from '@/types/guides'

interface Props {
  guide: GuideListItem
  isAdmin?: boolean
}

defineProps<Props>()
defineEmits<{
  click: []
  edit: []
  delete: []
  togglePublish: []
}>()

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}
</script>

<template>
  <q-card
    class="guide-card cursor-pointer"
    flat
    bordered
    @click="$emit('click')"
  >
    <q-card-section horizontal>
      <q-img
        v-if="guide.cover_image_url"
        :src="guide.cover_image_url"
        class="guide-card__cover"
        fit="cover"
        loading="lazy"
      />
      <q-card-section class="q-pt-sm col">
        <div class="row items-center q-gutter-x-sm q-mb-xs">
          <span class="text-subtitle1 text-weight-medium">{{ guide.title }}</span>
          <q-badge
            v-if="isAdmin && guide.status === 'DRAFT'"
            color="orange"
            label="Nháp"
          />
        </div>
        <div class="text-caption text-grey">
          {{ formatDate(guide.published_at || guide.created_at) }}
        </div>
      </q-card-section>
      <q-card-actions
        v-if="isAdmin"
        vertical
        class="q-px-sm"
        @click.stop
      >
        <q-btn
          flat round dense icon="edit" size="sm"
          @click="$emit('edit')"
        />
        <q-btn
          flat round dense
          :icon="guide.status === 'PUBLISHED' ? 'visibility_off' : 'visibility'"
          size="sm"
          @click="$emit('togglePublish')"
        />
        <q-btn
          flat round dense icon="delete" size="sm" color="negative"
          @click="$emit('delete')"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.guide-card {
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
  &__cover {
    width: 120px;
    min-height: 80px;
    border-radius: 4px 0 0 4px;
  }
}

@media (max-width: 599px) {
  .guide-card .q-card__section--horiz {
    flex-direction: column;
  }
  .guide-card__cover {
    width: 100%;
    height: 160px;
    border-radius: 4px 4px 0 0;
  }
}
</style>

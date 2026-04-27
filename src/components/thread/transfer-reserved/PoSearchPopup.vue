<template>
  <AppInput
    ref="inputRef"
    v-model="searchText"
    label="Tìm PO"
    append-icon="search"
    clearable
  />
  <q-menu
    v-model="menuOpen"
    no-focus
    no-refocus
    :target="inputRef?.$el"
    fit
  >
    <q-list style="min-width: 280px">
      <q-item v-if="loading">
        <q-item-section>
          <div class="row items-center q-gutter-sm">
            <q-spinner size="16px" />
            <span>Đang tìm...</span>
          </div>
        </q-item-section>
      </q-item>
      <q-item v-else-if="items.length === 0 && searchText">
        <q-item-section class="text-grey">
          Không tìm thấy PO
        </q-item-section>
      </q-item>
      <template v-else>
        <template
          v-for="po in items"
          :key="po.po_id"
        >
          <q-item
            v-for="week in po.weeks"
            :key="`${po.po_id}-${week.week_id}`"
            v-close-popup
            clickable
            @click="onSelect(po.po_number, week.week_id)"
          >
            <q-item-section>
              {{ po.po_number }} — {{ week.week_name }} ({{ week.total_cones }} cuộn)
            </q-item-section>
          </q-item>
        </template>
      </template>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { transferReservedService } from '@/services/transferReservedService'
import type { PoSearchResult } from '@/types/transferReserved'

const emit = defineEmits<{
  (e: 'select-week', payload: { weekId: number; poNumber: string }): void
}>()

const inputRef = ref<{ $el: HTMLElement } | null>(null)
const searchText = ref('')
const items = ref<PoSearchResult[]>([])
const loading = ref(false)
const menuOpen = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchText, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val || val.trim() === '') {
    items.value = []
    menuOpen.value = false
    return
  }
  debounceTimer = setTimeout(() => {
    doSearch(val.trim())
  }, 300)
})

async function doSearch(q: string) {
  loading.value = true
  menuOpen.value = true
  try {
    const res = await transferReservedService.searchPo(q)
    items.value = res.data || []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function onSelect(poNumber: string, weekId: number) {
  emit('select-week', { weekId, poNumber })
  searchText.value = ''
  items.value = []
  menuOpen.value = false
}

</script>

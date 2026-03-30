<template>
  <q-page padding>
    <PageHeader
      title="Import Sub-Art"
      subtitle="Nhập danh sách Sub-Art từ file Excel và liên kết với mã hàng"
      show-back
      back-to="/thread/styles"
    >
      <template #actions>
        <AppButton
          label="Tải mẫu Excel"
          icon="download"
          variant="outlined"
          color="primary"
          @click="downloadTemplate"
        />
      </template>
    </PageHeader>

    <q-card
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">
          Chọn file Excel (.xlsx) chứa danh sách Sub-Art (2 cột: Mã Hàng, Mã Sub-Art)
        </div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6">
            <FilePicker
              v-model="selectedFile"
              accept=".xlsx"
              label="Chọn file Excel"
              :hint="undefined"
              dense
              hide-bottom-space
              :disable="importing"
              @update:model-value="onFileSelected"
            />
          </div>
          <div class="col-auto">
            <AppButton
              label="Import"
              icon="upload"
              :disable="!selectedFile || importing"
              :loading="importing"
              @click="doImport"
            />
          </div>
        </div>

        <div
          v-if="importError"
          class="text-negative q-mt-sm"
        >
          {{ importError }}
        </div>
      </q-card-section>
    </q-card>

    <q-card
      v-if="importResult"
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-h6 q-mb-md">
          Kết quả Import
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-auto">
            <q-badge
              color="positive"
              class="q-pa-sm text-body2"
            >
              {{ importResult.imported }} đã import
            </q-badge>
          </div>
          <div
            v-if="importResult.skipped > 0"
            class="col-auto"
          >
            <q-badge
              color="blue-grey"
              class="q-pa-sm text-body2"
            >
              {{ importResult.skipped }} bỏ qua (trùng)
            </q-badge>
          </div>
          <div
            v-if="importResult.warnings.length > 0"
            class="col-auto"
          >
            <q-badge
              color="warning"
              class="q-pa-sm text-body2"
            >
              {{ importResult.warnings.length }} cảnh báo
            </q-badge>
          </div>
        </div>

        <q-table
          v-if="importResult.warnings.length > 0"
          flat
          bordered
          dense
          title="Cảnh báo"
          :rows="importResult.warnings"
          :columns="warningColumns"
          row-key="row"
          :rows-per-page-options="[10, 25, 50]"
          :pagination="{ page: 1, rowsPerPage: 25 }"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { subArtService } from '@/services/subArtService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ImportSubArtResult } from '@/types/thread/subArt'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.types.view'],
  },
})

const snackbar = useSnackbar()

const selectedFile = ref<File | null>(null)
const importing = ref(false)
const importError = ref('')
const importResult = ref<ImportSubArtResult | null>(null)

const warningColumns: QTableColumn[] = [
  { name: 'row', label: 'Dòng', field: 'row', align: 'center' },
  { name: 'style_code', label: 'Mã Hàng', field: 'style_code', align: 'left' },
  { name: 'sub_art_code', label: 'Sub-Art', field: 'sub_art_code', align: 'left' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
]

function onFileSelected(file: File | File[] | null) {
  if (Array.isArray(file)) {
    selectedFile.value = file[0] ?? null
  }
  importError.value = ''
  importResult.value = null
}

async function downloadTemplate() {
  try {
    await subArtService.downloadTemplate()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể tải file mẫu')
  }
}

async function doImport() {
  if (!selectedFile.value) return

  importing.value = true
  importError.value = ''
  importResult.value = null

  try {
    const result = await subArtService.importExcel(selectedFile.value)
    importResult.value = result
    if (result.imported > 0) {
      snackbar.success(`Import thành công ${result.imported} Sub-Art`)
    } else {
      snackbar.warning('Không có Sub-Art nào được import')
    }
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Lỗi khi import dữ liệu'
    snackbar.error(importError.value)
  } finally {
    importing.value = false
  }
}
</script>

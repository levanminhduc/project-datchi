<script setup lang="ts">
/**
 * New Issue Request Page
 * Tạo phiếu xuất kho mới
 *
 * Form for creating new thread issuance requests
 */
import { useRouter } from 'vue-router'
import { useIssueRequests } from '@/composables/thread/useIssueRequests'
import IssueRequestForm from '@/components/thread/IssueRequestForm.vue'
import type { CreateIssueRequestDTO } from '@/types/thread/issue'

const router = useRouter()
const { createRequest, isLoading } = useIssueRequests()

async function handleSubmit(data: CreateIssueRequestDTO) {
  const created = await createRequest(data)
  if (created) {
    router.push(`/thread/issues/${created.id}`)
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <q-btn
        icon="arrow_back"
        flat
        round
        @click="handleCancel"
      />
      <h5 class="q-ma-none q-ml-sm">
        Tạo Phiếu Xuất Mới
      </h5>
    </div>

    <q-card
      flat
      bordered
    >
      <q-card-section>
        <IssueRequestForm
          :loading="isLoading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

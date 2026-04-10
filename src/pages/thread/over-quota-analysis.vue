<script setup lang="ts">
import { PageHeader } from '@/components/ui/layout'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import OverQuotaFilterBar from '@/components/over-quota/OverQuotaFilterBar.vue'
import OverQuotaSummaryCards from '@/components/over-quota/OverQuotaSummaryCards.vue'
import OverQuotaRankingChart from '@/components/over-quota/OverQuotaRankingChart.vue'
import OverQuotaComparisonChart from '@/components/over-quota/OverQuotaComparisonChart.vue'
import OverQuotaReasonChart from '@/components/over-quota/OverQuotaReasonChart.vue'
import OverQuotaTrendChart from '@/components/over-quota/OverQuotaTrendChart.vue'
import OverQuotaDeptChart from '@/components/over-quota/OverQuotaDeptChart.vue'
import OverQuotaDrilldownTable from '@/components/over-quota/OverQuotaDrilldownTable.vue'
import { useOverQuotaAnalysis } from '@/composables/thread/useOverQuotaAnalysis'
import { useOverQuotaCharts } from '@/composables/thread/useOverQuotaCharts'

const {
  filters,
  summary,
  byStyleData,
  trendData,
  byDeptData,
  isLoadingSummary,
  isLoadingCharts,
  granularity,
  fetchAll,
  handleApplyFilters,
  handleStyleClick,
  handleClearFilters,
  exportToXlsx,
} = useOverQuotaAnalysis()

const {
  topN,
  rankingOption,
  comparisonOption,
  reasonOption,
  trendOption,
  deptOption,
} = useOverQuotaCharts(byStyleData, trendData, byDeptData)

function onBarClick(styleId: number) {
  handleStyleClick(styleId)
}
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Phân Tích Vượt Định Mức"
      subtitle="Thống kê và phân tích các trường hợp vượt định mức cấp chỉ"
      icon="analytics"
    >
      <template #actions>
        <AppButton
          label="Làm mới"
          icon="refresh"
          color="primary"
          variant="outlined"
          :loading="isLoadingSummary || isLoadingCharts"
          @click="fetchAll()"
        />
        <AppButton
          label="Xuất Excel"
          icon="download"
          color="primary"
          @click="exportToXlsx"
        />
      </template>
    </PageHeader>

    <OverQuotaFilterBar
      v-model:filters="filters"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />

    <OverQuotaSummaryCards
      :data="summary"
      :loading="isLoadingSummary"
    />

    <div
      v-if="summary?.total_over_events === 0 && !isLoadingSummary"
      class="text-center q-py-xl"
    >
      <q-icon
        name="check_circle"
        size="64px"
        color="positive"
      />
      <div class="text-h6 text-positive q-mt-md">
        Không có dữ liệu vượt định mức
      </div>
      <div class="text-grey-6">
        Trong khoảng thời gian đã chọn, không có trường hợp vượt định mức nào.
      </div>
    </div>

    <template v-else>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-7">
          <OverQuotaRankingChart
            v-model:top-n="topN"
            :option="rankingOption"
            :loading="isLoadingCharts"
            :has-data="byStyleData.length > 0"
            @bar-click="onBarClick"
          />
        </div>
        <div class="col-12 col-md-5">
          <OverQuotaComparisonChart
            :option="comparisonOption"
            :loading="isLoadingCharts"
            :has-data="byStyleData.length > 0"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-5">
          <OverQuotaReasonChart
            :option="reasonOption"
            :loading="isLoadingCharts"
            :has-data="byStyleData.length > 0"
          />
        </div>
        <div class="col-12 col-md-4">
          <OverQuotaTrendChart
            v-model:granularity="granularity"
            :option="trendOption"
            :loading="isLoadingCharts"
            :has-data="trendData.length > 0"
            @granularity-change="granularity = $event"
          />
        </div>
        <div class="col-12 col-md-3">
          <OverQuotaDeptChart
            :option="deptOption"
            :loading="isLoadingCharts"
            :has-data="byDeptData.length > 0"
          />
        </div>
      </div>

      <OverQuotaDrilldownTable :filters="filters" />
    </template>
  </q-page>
</template>

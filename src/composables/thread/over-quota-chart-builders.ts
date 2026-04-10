import type { StyleOverQuotaItem, TrendDataPoint, DeptBreakdownItem } from '@/types/thread/overQuota'

const COLORS = {
  red: '#C10015',
  teal: '#26A69A',
  orange: '#FB8C00',
  deepRed: '#E53935',
  amber: '#F2C037',
}

const DEPT_PALETTE = ['#1976D2', '#26A69A', '#F2C037', '#E53935', '#9C27B0', '#31CCEC']

function shouldAnimate(): boolean {
  return typeof window !== 'undefined'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function buildRankingOption(data: StyleOverQuotaItem[], topN: number) {
  const sorted = [...data]
    .sort((a, b) => b.total_excess - a.total_excess)
    .slice(0, topN)
    .reverse()

  return {
    animation: shouldAnimate(),
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        if (!p) return ''
        return `${p.name}<br/>Vuot: <b>${p.value} cuon</b>`
      },
    },
    grid: { left: 130, right: 60, top: 10, bottom: 10 },
    xAxis: { type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((d) => d.style_code),
      axisLabel: { width: 110, overflow: 'truncate' as const },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((d) => ({
          value: d.total_excess,
          styleId: d.style_id,
        })),
        itemStyle: { color: COLORS.red, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right' as const, formatter: '{c}' },
      },
    ],
  }
}

export function buildComparisonOption(data: StyleOverQuotaItem[]) {
  const top10 = [...data].sort((a, b) => b.total_excess - a.total_excess).slice(0, 10)
  const names = top10.map((d) => d.style_code)

  return {
    animation: shouldAnimate(),
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: Array<{ seriesName: string; value: number; name: string }>) => {
        const first = params[0]
        if (!first) return ''
        let html = `<b>${first.name}</b>`
        params.forEach((p) => {
          html += `<br/>${p.seriesName}: ${p.value} cuon`
        })
        return html
      },
    },
    legend: { bottom: 0 },
    grid: { left: 50, right: 20, top: 10, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: names,
      axisLabel: { rotate: 35 },
    },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: 'Dinh muc',
        type: 'bar' as const,
        data: top10.map((d) => d.total_quota),
        itemStyle: { color: COLORS.teal },
      },
      {
        name: 'Thuc cap',
        type: 'bar' as const,
        data: top10.map((d) => ({
          value: d.total_issued,
          itemStyle: { color: d.total_issued > d.total_quota ? COLORS.red : COLORS.teal },
        })),
      },
    ],
  }
}

export function buildReasonOption(data: StyleOverQuotaItem[]) {
  const filtered = data.filter(
    (d) => d.reason_breakdown.ky_thuat > 0 || d.reason_breakdown.rai_dau_may > 0,
  )
  const sorted = [...filtered].sort(
    (a, b) =>
      b.reason_breakdown.ky_thuat +
      b.reason_breakdown.rai_dau_may -
      (a.reason_breakdown.ky_thuat + a.reason_breakdown.rai_dau_may),
  ).slice(0, 10).reverse()

  return {
    animation: shouldAnimate(),
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
    },
    legend: { bottom: 0 },
    grid: { left: 130, right: 20, top: 10, bottom: 40 },
    xAxis: { type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((d) => d.style_code),
      axisLabel: { width: 110, overflow: 'truncate' as const },
    },
    series: [
      {
        name: 'Ky Thuat',
        type: 'bar' as const,
        stack: 'reason',
        data: sorted.map((d) => d.reason_breakdown.ky_thuat),
        itemStyle: { color: COLORS.deepRed },
      },
      {
        name: 'Rai dau may',
        type: 'bar' as const,
        stack: 'reason',
        data: sorted.map((d) => d.reason_breakdown.rai_dau_may),
        itemStyle: { color: COLORS.orange },
      },
    ],
  }
}

export function buildTrendOption(data: TrendDataPoint[]) {
  return {
    animation: shouldAnimate(),
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: Array<{ seriesName: string; value: number; axisValueLabel: string }>) => {
        const first = params[0]
        if (!first) return ''
        let html = `<b>${first.axisValueLabel}</b>`
        params.forEach((p) => {
          const unit = p.seriesName === 'So luot' ? 'luot' : 'cuon'
          html += `<br/>${p.seriesName}: ${p.value} ${unit}`
        })
        return html
      },
    },
    legend: { bottom: 0 },
    grid: { left: 50, right: 50, top: 10, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: data.map((d) => d.period_label),
    },
    yAxis: [
      { type: 'value' as const, name: 'So luot', position: 'left' as const },
      { type: 'value' as const, name: 'Cones vuot', position: 'right' as const },
    ],
    series: [
      {
        name: 'So luot',
        type: 'line' as const,
        yAxisIndex: 0,
        data: data.map((d) => d.over_count),
        smooth: true,
        symbol: 'circle',
        itemStyle: { color: COLORS.deepRed },
      },
      {
        name: 'Cones vuot',
        type: 'line' as const,
        yAxisIndex: 1,
        data: data.map((d) => d.excess_cones),
        smooth: true,
        symbol: 'circle',
        lineStyle: { type: 'dashed' as const },
        itemStyle: { color: COLORS.amber },
      },
    ],
  }
}

export function buildDeptOption(data: DeptBreakdownItem[]) {
  return {
    animation: shouldAnimate(),
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}: ${params.value} luot (${params.percent}%)`,
    },
    legend: {
      orient: 'vertical' as const,
      left: 'left',
    },
    color: DEPT_PALETTE,
    series: [
      {
        type: 'pie' as const,
        radius: ['45%', '70%'],
        center: ['65%', '50%'],
        data: data.map((d) => ({ name: d.dept, value: d.count })),
        label: { show: false },
        emphasis: {
          label: { show: true, fontWeight: 'bold' as const },
        },
      },
    ],
  }
}

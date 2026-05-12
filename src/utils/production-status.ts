export type ProductionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'OVER'

export interface ProductionStatusInfo {
  status: ProductionStatus
  label: string
  color: string
  progressColor: string
  icon: string
  badgeOutline: boolean
  progressPercent: number
  overPercent: number
}

export interface ProductionStatusInput {
  total_quota_cones: number
  total_issued_cones: number
  total_net_issued: number
  total_pending_cones: number
  over_quota_cones?: number
}

const STATUS_MAP: Record<ProductionStatus, Omit<ProductionStatusInfo, 'progressPercent' | 'overPercent'>> = {
  PENDING: {
    status: 'PENDING',
    label: 'Chờ',
    color: 'grey-6',
    progressColor: 'grey-4',
    icon: 'hourglass_empty',
    badgeOutline: true,
  },
  IN_PROGRESS: {
    status: 'IN_PROGRESS',
    label: 'Đang SX',
    color: 'blue-6',
    progressColor: 'blue-5',
    icon: 'precision_manufacturing',
    badgeOutline: true,
  },
  DONE: {
    status: 'DONE',
    label: 'Đã đủ',
    color: 'positive',
    progressColor: 'positive',
    icon: 'check_circle',
    badgeOutline: false,
  },
  OVER: {
    status: 'OVER',
    label: 'Vượt Định Mức',
    color: 'negative',
    progressColor: 'negative',
    icon: 'warning',
    badgeOutline: false,
  },
}

export function getProductionStatus(summary: ProductionStatusInput): ProductionStatusInfo {
  const quota = summary.total_quota_cones
  const issued = summary.total_issued_cones
  const net = summary.total_net_issued
  const pending = summary.total_pending_cones
  const over = summary.over_quota_cones ?? Math.max(0, net - quota)

  let status: ProductionStatus
  if (over > 0) {
    status = 'OVER'
  } else if (issued === 0) {
    status = 'PENDING'
  } else if (pending === 0) {
    status = 'DONE'
  } else {
    status = 'IN_PROGRESS'
  }

  const progressPercent = quota === 0
    ? (status === 'DONE' ? 100 : 0)
    : Math.min(100, Math.round((net / quota) * 100))

  const overPercent = quota === 0 || over === 0
    ? 0
    : Math.round((over / quota) * 100)

  return {
    ...STATUS_MAP[status],
    progressPercent,
    overPercent,
  }
}

export const PRODUCTION_STATUS_LIST: ProductionStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'OVER']

export function getProductionStatusMeta(status: ProductionStatus) {
  return STATUS_MAP[status]
}

import { ref, computed } from 'vue'
import { transferReservedService } from '@/services/transferReservedService'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  ReservedByPoResponse,
  TransferReservedItem,
} from '@/types/transferReserved'

interface SelectionEntry {
  thread_type_id: number
  color_id: number
  available_full: number
  available_partial: number
  full_quantity: number
  partial_quantity: number
  label: string
}

export function useTransferReserved() {
  const snackbar = useSnackbar()

  const weekId = ref<number | null>(null)
  const fromWarehouseId = ref<number | null>(null)
  const toWarehouseId = ref<number | null>(null)
  const data = ref<ReservedByPoResponse | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const selected = ref<Map<string, SelectionEntry>>(new Map())

  const keyOf = (tt: number, c: number) => `${tt}-${c}`

  async function fetchData() {
    if (!weekId.value || !fromWarehouseId.value) return
    loading.value = true
    try {
      const res = await transferReservedService.getReservedByPo(
        weekId.value,
        fromWarehouseId.value
      )
      if (res.error) {
        snackbar.error(res.error)
        data.value = null
      } else {
        data.value = res.data
        selected.value = new Map()
      }
    } catch (e: any) {
      snackbar.error(e?.message || 'Lỗi tải dữ liệu')
    } finally {
      loading.value = false
    }
  }

  function toggle(
    tt: number,
    c: number,
    availableFull: number,
    availablePartial: number,
    label: string
  ) {
    const k = keyOf(tt, c)
    if (selected.value.has(k)) {
      selected.value.delete(k)
    } else {
      selected.value.set(k, {
        thread_type_id: tt,
        color_id: c,
        available_full: availableFull,
        available_partial: availablePartial,
        full_quantity: availableFull,
        partial_quantity: availablePartial,
        label,
      })
    }
    selected.value = new Map(selected.value)
  }

  function setFullQuantity(tt: number, c: number, q: number) {
    const entry = selected.value.get(keyOf(tt, c))
    if (!entry) return
    entry.full_quantity = q
    selected.value = new Map(selected.value)
  }

  function setPartialQuantity(tt: number, c: number, q: number) {
    const entry = selected.value.get(keyOf(tt, c))
    if (!entry) return
    entry.partial_quantity = q
    selected.value = new Map(selected.value)
  }

  const selectedArray = computed(() => Array.from(selected.value.values()))
  const totalSelectedCones = computed(() =>
    selectedArray.value.reduce(
      (s, x) => s + (Number(x.full_quantity) || 0) + (Number(x.partial_quantity) || 0),
      0
    )
  )
  const hasInvalid = computed(() =>
    selectedArray.value.some((x) => {
      const f = Number(x.full_quantity)
      const p = Number(x.partial_quantity)
      if (!Number.isFinite(f) || !Number.isFinite(p)) return true
      if (f < 0 || p < 0) return true
      if (f > x.available_full || p > x.available_partial) return true
      if (f + p === 0) return true
      return false
    })
  )
  const canSubmit = computed(
    () =>
      !!weekId.value &&
      !!fromWarehouseId.value &&
      !!toWarehouseId.value &&
      fromWarehouseId.value !== toWarehouseId.value &&
      selectedArray.value.length > 0 &&
      !hasInvalid.value &&
      !submitting.value
  )

  async function submit(): Promise<boolean> {
    if (!canSubmit.value || !weekId.value) return false
    submitting.value = true
    try {
      const items: TransferReservedItem[] = selectedArray.value.map((x) => ({
        thread_type_id: x.thread_type_id,
        color_id: x.color_id,
        full_quantity: Number(x.full_quantity) || 0,
        partial_quantity: Number(x.partial_quantity) || 0,
      }))
      const res = await transferReservedService.submit(weekId.value, {
        from_warehouse_id: fromWarehouseId.value!,
        to_warehouse_id: toWarehouseId.value!,
        items,
      })
      if (res.error) {
        snackbar.error(res.error)
        return false
      }
      snackbar.success(res.message || `Đã chuyển ${res.data?.total_cones} cuộn`)
      await fetchData()
      return true
    } catch (e: any) {
      snackbar.error(e?.message || 'Lỗi khi chuyển cuộn')
      return false
    } finally {
      submitting.value = false
    }
  }

  function isSelected(tt: number, c: number) {
    return selected.value.has(keyOf(tt, c))
  }

  function getSelection(tt: number, c: number) {
    return selected.value.get(keyOf(tt, c))
  }

  return {
    weekId,
    fromWarehouseId,
    toWarehouseId,
    data,
    loading,
    submitting,
    selected,
    selectedArray,
    totalSelectedCones,
    canSubmit,
    hasInvalid,
    fetchData,
    toggle,
    setFullQuantity,
    setPartialQuantity,
    submit,
    isSelected,
    getSelection,
  }
}

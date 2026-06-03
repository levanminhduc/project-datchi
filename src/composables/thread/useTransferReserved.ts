import { ref, computed } from 'vue'
import { transferReservedService } from '@/services/transferReservedService'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatThreadTypeDisplay } from '@/utils/thread-format'
import type {
  TransferByCalcResponse,
  TransferReservedItem,
  TransferThreadLine,
} from '@/types/transferReserved'

interface SelectionEntry {
  thread_type_id: number
  thread_color_id: number
  selected_in_po_id: number | null
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
  const data = ref<TransferByCalcResponse | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const selected = ref<Map<string, SelectionEntry>>(new Map())

  const keyOf = (tt: number, cc: number) => `${tt}_${cc}`

  async function fetchData() {
    if (!weekId.value || !fromWarehouseId.value) return
    loading.value = true
    try {
      const res = await transferReservedService.getTransferByCalculation(
        weekId.value,
        fromWarehouseId.value,
        toWarehouseId.value,
      )
      if (res.error) {
        snackbar.error(res.error)
        data.value = null
      } else {
        data.value = res.data
        selected.value = new Map()
        if (res.message) snackbar.info(res.message)
      }
    } catch (e: unknown) {
      snackbar.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu')
    } finally {
      loading.value = false
    }
  }

  function toggle(
    poId: number | null,
    line: TransferThreadLine,
  ) {
    const k = keyOf(line.thread_type_id, line.thread_color_id)
    if (selected.value.has(k)) {
      selected.value.delete(k)
    } else {
      const fullAtSource = Math.min(line.reserved_at_source, line.pending_for_po)
      const partialAtSource = 0
      selected.value.set(k, {
        thread_type_id: line.thread_type_id,
        thread_color_id: line.thread_color_id,
        selected_in_po_id: poId,
        available_full: line.reserved_at_source,
        available_partial: 0,
        full_quantity: fullAtSource,
        partial_quantity: partialAtSource,
        label: formatThreadTypeDisplay(line.supplier_name, line.tex_number, line.color_name),
      })
    }
    selected.value = new Map(selected.value)
  }

  function setFullQuantity(tt: number, cc: number, q: number) {
    const entry = selected.value.get(keyOf(tt, cc))
    if (!entry) return
    entry.full_quantity = q
    selected.value = new Map(selected.value)
  }

  function setPartialQuantity(tt: number, cc: number, q: number) {
    const entry = selected.value.get(keyOf(tt, cc))
    if (!entry) return
    entry.partial_quantity = q
    selected.value = new Map(selected.value)
  }

  function isSelected(tt: number, cc: number) {
    return selected.value.has(keyOf(tt, cc))
  }

  function getSelection(tt: number, cc: number) {
    return selected.value.get(keyOf(tt, cc))
  }

  function selectedInOtherPo(poId: number | null, tt: number, cc: number): number | null {
    const entry = selected.value.get(keyOf(tt, cc))
    if (!entry) return null
    if (entry.selected_in_po_id === poId) return null
    return entry.selected_in_po_id
  }

  const selectedArray = computed(() => Array.from(selected.value.values()))
  const totalSelectedCones = computed(() =>
    selectedArray.value.reduce(
      (s, x) => s + (Number(x.full_quantity) || 0) + (Number(x.partial_quantity) || 0),
      0,
    ),
  )
  const hasInvalid = computed(() =>
    selectedArray.value.some(x => {
      const f = Number(x.full_quantity)
      const p = Number(x.partial_quantity)
      if (!Number.isFinite(f) || !Number.isFinite(p)) return true
      if (f < 0 || p < 0) return true
      if (f > x.available_full || p > x.available_partial) return true
      if (f + p === 0) return true
      return false
    }),
  )
  const canSubmit = computed(
    () =>
      !!weekId.value &&
      !!fromWarehouseId.value &&
      !!toWarehouseId.value &&
      fromWarehouseId.value !== toWarehouseId.value &&
      selectedArray.value.length > 0 &&
      !hasInvalid.value &&
      !submitting.value,
  )

  async function submit(): Promise<boolean> {
    if (!canSubmit.value || !weekId.value) return false
    submitting.value = true
    try {
      const items: TransferReservedItem[] = selectedArray.value.map(x => ({
        thread_type_id: x.thread_type_id,
        color_id: x.thread_color_id,
        full_quantity: Number(x.full_quantity) || 0,
        partial_quantity: Number(x.partial_quantity) || 0,
        po_id: x.selected_in_po_id,
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
    } catch (e: unknown) {
      snackbar.error(e instanceof Error ? e.message : 'Lỗi khi chuyển cuộn')
      return false
    } finally {
      submitting.value = false
    }
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
    selectedInOtherPo,
  }
}

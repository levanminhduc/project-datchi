export const MAX_TOOL_ROWS = 500
export const API_PAGE_SIZE = 100

export interface Page<T> {
  rows: T[]
  total: number
}

export async function collectPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
  maxRows = MAX_TOOL_ROWS,
): Promise<Page<T>> {
  const first = await fetchPage(1, API_PAGE_SIZE)
  const wanted = Math.min(first.total, maxRows)
  const pageCount = first.rows.length < API_PAGE_SIZE ? 1 : Math.ceil(wanted / API_PAGE_SIZE)
  const rest = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) => fetchPage(index + 2, API_PAGE_SIZE)),
  )
  const rows = [first, ...rest].flatMap((page) => page.rows).slice(0, maxRows)
  return { rows, total: first.total }
}

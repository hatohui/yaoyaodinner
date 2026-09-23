import { useEffect, useMemo, useState } from 'react'
import { useGetTables } from '@/api/tables/tables'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import type { TableListDto } from '@/api/model'
import { TABLE_FETCH_ALL_COUNT } from '@/common/constants'

export type TableFilter = 'all' | 'free' | 'full' | 'hosted'

export function useTableSearch() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TableFilter>('all')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useGetTables<TableListDto>({
    count: TABLE_FETCH_ALL_COUNT,
    search: debouncedSearch || undefined,
  })

  const tables = useMemo(() => {
    const rows = data?.tables ?? []
    switch (filter) {
      case 'free':
        return rows.filter(tb => tb.seated < tb.capacity)
      case 'full':
        return rows.filter(tb => tb.seated >= tb.capacity)
      default:
        return rows
    }
  }, [data?.tables, filter])

  const pagination = usePagination({ total: tables.length, initialCount: 12 })
  const { page, count, setPage } = pagination

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filter, setPage])

  const pagedTables = useMemo(
    () => tables.slice((page - 1) * count, page * count),
    [tables, page, count]
  )

  return {
    search,
    setSearch,
    filter,
    setFilter,
    tables,
    pagedTables,
    isLoading,
    isError,
    refetch,
    pagination,
  }
}

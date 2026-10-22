import { useEffect, useMemo, useState } from 'react'
import { useGetTables } from '@/api/tables/tables'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import type { TableDto, TableListDto } from '@/api/model'
import { TABLE_FETCH_ALL_COUNT } from '@/common/constants'

export const TABLE_SORTS = [
	'number',
	'most_ordered',
	'least_ordered',
	'name_asc',
	'name_desc',
	'most_people',
] as const

export type TableSort = (typeof TABLE_SORTS)[number]

const byTotal = (tb: TableDto) => tb.orderTotal ?? 0

const COMPARE: Record<TableSort, (a: TableDto, b: TableDto) => number> = {
	number: (a, b) => a.no - b.no,
	most_ordered: (a, b) => byTotal(b) - byTotal(a) || a.no - b.no,
	least_ordered: (a, b) => byTotal(a) - byTotal(b) || a.no - b.no,
	name_asc: (a, b) => a.name.localeCompare(b.name),
	name_desc: (a, b) => b.name.localeCompare(a.name),
	most_people: (a, b) => b.seated - a.seated || a.no - b.no,
}

export function useTableSearch() {
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState<TableSort>('number')
	const debouncedSearch = useDebounce(search, 300)

	const { data, isLoading, isError, refetch } = useGetTables<TableListDto>({
		count: TABLE_FETCH_ALL_COUNT,
		search: debouncedSearch || undefined,
	})

	const tables = useMemo(
		() => [...(data?.tables ?? [])].sort(COMPARE[sort]),
		[data?.tables, sort]
	)

	const pagination = usePagination({ total: tables.length, initialCount: 12 })
	const { page, count, setPage } = pagination

	useEffect(() => {
		setPage(1)
	}, [debouncedSearch, sort, setPage])

	const pagedTables = useMemo(
		() => tables.slice((page - 1) * count, page * count),
		[tables, page, count]
	)

	return {
		search,
		setSearch,
		sort,
		setSort,
		tables,
		pagedTables,
		isLoading,
		isError,
		refetch,
		pagination,
	}
}

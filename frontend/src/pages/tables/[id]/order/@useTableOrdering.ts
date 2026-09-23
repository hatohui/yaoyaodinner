import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useGetFoods } from '@/api/foods/foods'
import { useGetCategories } from '@/api/categories/categories'
import { useGetTableById } from '@/api/tables/tables'
import type {
	CategoryItemDto,
	FoodItemDto,
	GetFoodsResponseDto,
	TableDto,
} from '@/api/model'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { STALE_TIME_STATIC } from '@/common/constants'
import type { MenuSort } from '@/utils/searchParams'

export function useTableOrdering() {
	const { id = '' } = useParams()
	const { i18n } = useTranslation()

	const [search, setSearch] = useState('')
	const [category, setCategory] = useState('all')
	const [sort, setSort] = useState<MenuSort>('name')
	const [popular, setPopular] = useState(false)
	const [recommended, setRecommended] = useState(false)
	const [total, setTotal] = useState(0)

	const debouncedSearch = useDebounce(search, 300)
	const pagination = usePagination({ total, initialCount: 12 })
	const { page, count, setPage } = pagination

	useEffect(() => {
		setPage(1)
	}, [debouncedSearch, category, sort, popular, recommended, setPage])

	const { data: table } = useGetTableById<TableDto>(id)

	const { data: categories = [] } = useGetCategories<CategoryItemDto[]>(
		{ lang: i18n.language },
		{ query: { staleTime: STALE_TIME_STATIC } }
	)

	const { data, isLoading, isError } = useGetFoods<GetFoodsResponseDto>(
		{
			lang: i18n.language,
			page,
			count,
			category: category === 'all' ? undefined : category,
			sortBy: sort === 'price_desc' ? 'price' : sort,
			sortOrder: sort === 'price_desc' ? 'desc' : 'asc',
			popular: popular || undefined,
			recommended: recommended || undefined,
		},
		{ query: { staleTime: STALE_TIME_STATIC } }
	)

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const foods = useMemo(() => {
		const all = data?.foods ?? []
		const q = debouncedSearch.trim().toLowerCase()
		if (!q) return all
		return all.filter(
			(f: FoodItemDto) =>
				f.name.toLowerCase().includes(q) ||
				f.description?.toLowerCase().includes(q)
		)
	}, [data?.foods, debouncedSearch])

	const setFilter = (filter: {
		category: string
		popular: boolean
		recommended: boolean
	}) => {
		setCategory(filter.category)
		setPopular(filter.popular)
		setRecommended(filter.recommended)
	}

	return {
		tableId: id,
		table,
		search,
		setSearch,
		category,
		sort,
		setSort,
		popular,
		recommended,
		setFilter,
		categories,
		foods,
		isLoading,
		isError,
		pagination,
	}
}

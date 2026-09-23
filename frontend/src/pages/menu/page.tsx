import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetFoods } from '@/api/foods/foods'
import { useGetCategories } from '@/api/categories/categories'
import { usePagination } from '@/hooks/usePagination'
import { useMenuSearchParams } from '@/utils/searchParams'
import { FilterBar } from './@FilterBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import { FoodCard } from './@FoodCard'
import { SelectionBar } from './@SelectionBar'
import { TablePickerModal } from './@TablePickerModal'
import { OrderConfigModal } from './@OrderConfigModal'
import { FoodDetailModal } from './[id]/@FoodDetailModal'
import { useMenuSelection } from './@useMenuSelection'
import { LoadingView, LoadingSpinner } from './@LoadingView'
import { ErrorView } from './@ErrorView'
import { EmptyView } from './@EmptyView'
import { STALE_TIME_STATIC } from '@/common/constants'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import type {
	FoodItemDto,
	CategoryItemDto,
	GetFoodsResponseDto,
} from '@/api/model'

export default function MenuPage() {
	const { t, i18n } = useTranslation()
	const [search, setSearch] = useState('')
	const [total, setTotal] = useState(0)
	const [quickViewId, setQuickViewId] = useState<string | null>(null)
	const pin = useGuest(s => s.pin)
	const { isAdmin } = useIsAdmin()
	const canOrder = Boolean(pin) || isAdmin

	const {
		page: urlPage,
		count: urlCount,
		category,
		sort,
		popular,
		recommended,
		setPage: setUrlPage,
		setCount: setUrlCount,
		setSort,
		setFilter,
		resetParams,
	} = useMenuSearchParams()

	const pagination = usePagination({
		initialPage: urlPage,
		initialCount: urlCount,
		total,
		onPageChange: setUrlPage,
		onCountChange: setUrlCount,
	})
	
	const { page, count } = pagination

	const { data, isLoading, isError, error, refetch } =
		useGetFoods<GetFoodsResponseDto>(
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
			{ query: { staleTime: STALE_TIME_STATIC, refetchOnWindowFocus: false } }
		)

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const { data: categoriesRaw } = useGetCategories<CategoryItemDto[]>(
		{ lang: i18n.language },
		{ query: { staleTime: STALE_TIME_STATIC, refetchOnWindowFocus: false } }
	)

	const categories = useMemo<CategoryItemDto[]>(
		() => (Array.isArray(categoriesRaw) ? categoriesRaw : []),
		[categoriesRaw]
	)

	const categoryNames = useMemo(
		() => new Map(categories.map(c => [c.id, c.name ?? c.key])),
		[categories]
	)

	const filteredFoods = useMemo(() => {
		if (!data?.foods) return []
		if (!search.trim()) return data.foods
		const q = search.toLowerCase()
		return data.foods.filter(
			(f: FoodItemDto) =>
				f.name.toLowerCase().includes(q) ||
				f.description?.toLowerCase().includes(q)
		)
	}, [data?.foods, search])

	const hasFilters =
		category !== 'all' || search.trim() !== '' || popular || recommended

	const handleReset = () => {
		resetParams()
		setSearch('')
	}

	const selection = useMenuSelection(filteredFoods)

	return (
		<div className='min-h-screen'>
			<div className='mx-auto max-w-[1400px] px-4'>
				<FilterBar
					search={search}
					onSearchChange={setSearch}
					activeCategory={category}
					categories={categories}
					sort={sort}
					onSortChange={setSort}
					popular={popular}
					recommended={recommended}
					onFilterChange={setFilter}
				/>

				<div className='py-8'>
					{isLoading && !data ? (
						<LoadingView />
					) : isError && error ? (
						<ErrorView error={error as Error} onRetry={() => refetch()} />
					) : isLoading ? (
						<LoadingSpinner />
					) : filteredFoods.length === 0 ? (
						<EmptyView hasFilters={hasFilters} onReset={handleReset} />
					) : (
						<>
							<div className='grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
								{filteredFoods.map((food: FoodItemDto) => (
									<FoodCard
										key={food.id}
										food={food}
										categoryName={
											food.categoryId
												? categoryNames.get(food.categoryId)
												: undefined
										}
										selected={selection.selected.has(food.id)}
										onToggleSelect={
											canOrder ? () => selection.toggle(food.id) : undefined
										}
										onQuickView={setQuickViewId}
									/>
								))}
							</div>

							<div className='mt-10 flex flex-col items-center gap-3'>
								<PaginationBar pagination={pagination} />
								<p className='text-xs text-muted-foreground'>
									{t('menu.showing', {
										from: (page - 1) * count + 1,
										to: Math.min(page * count, data!.total),
										total: data!.total,
									})}
								</p>
							</div>
						</>
					)}
				</div>
			</div>

			<SelectionBar
				count={selection.count}
				onClear={selection.clear}
				onAdd={selection.openPicker}
			/>

			<TablePickerModal
				open={selection.pickerOpen}
				onOpenChange={selection.setPickerOpen}
				onSelect={selection.selectTable}
			/>

			<OrderConfigModal
				open={selection.configOpen}
				onOpenChange={selection.setConfigOpen}
				tableId={selection.tableId}
				foods={selection.selectedFoods.map(f => ({
					id: f.id,
					name: f.name,
					defaultVariantId: f.defaultVariantId,
				}))}
				onSuccess={selection.handleDone}
				onChangeTable={selection.changeTable}
			/>

			<FoodDetailModal
				id={quickViewId}
				onOpenChange={open => !open && setQuickViewId(null)}
			/>
		</div>
	)
}

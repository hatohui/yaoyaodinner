import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ReceiptText, ShoppingCart, UserPlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ProductGridSkeleton } from '../@Skeletons'
import { PaginationBar } from '@/components/common/PaginationBar'
import { FilterBar } from '@/pages/menu/@FilterBar'
import { FilterSidebar } from './@FilterSidebar'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { useGetOrders } from '@/api/orders/orders'
import type {
	FoodItemDto,
	FoodSuggestionDto,
	OrderResponseDto,
} from '@/api/model'
import { ProductCard } from './@ProductCard'
import { CartPanel } from '@/components/ordering/CartPanel'
import { OrderedList } from '@/components/ordering/OrderedList'
import { countDishes, groupOrders } from '@/components/ordering/groupOrders'
import {
	OrderSidePanel,
	type SidePanelTab,
} from '@/components/ordering/OrderSidePanel'
import { AddToCartModal } from '@/components/ordering/AddToCartModal'
import { useTableOrdering } from './@useTableOrdering'
import { useOrderCart } from '@/hooks/useOrderCart'
import { useExcludeFilter } from '@/hooks/useExcludeFilter'
import { ExcludeFilter } from '@/components/ordering/ExcludeFilter'
import { useFoodWishes, wishStatus } from '@/hooks/useTableWishes'
import { WishlistStrip } from '@/components/ordering/WishlistStrip'
import { WishMenu } from '@/components/ordering/WishMenu'
import { FoodDetailModal } from '@/pages/menu/[id]/@FoodDetailModal'
import { useMenuOrderingStore } from '@/pages/menu/@useMenuOrdering'
import { allergyGroups } from '../@planBoard'
import { OrderLocked } from './@OrderLocked'
import { OrderingClosed } from './@OrderingClosed'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { useTableAccess } from '@/hooks/useTableCode'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/shadcn'
import { TABLE_LIVE_REFETCH_MS } from '@/common/constants'

export default function TableOrderPage() {
	const { t } = useTranslation()
	const toast = useToast()
	const { id: routeTableId = '' } = useParams()
	const exclude = useExcludeFilter(routeTableId)
	const {
		tableId,
		table,
		tableLoading,
		search,
		setSearch,
		category,
		sort,
		setSort,
		popular,
		recommended,
		setFilter,
		categories,
		categoriesState,
		foods,
		total,
		isLoading,
		isRefreshing,
		isError,
		pagination,
	} = useTableOrdering(exclude.query)
	const cart = useOrderCart(tableId)
	const { canEdit } = useTableAccess(tableId)
	const { canAdd } = useOrderingStage()
	useEffect(() => {
		if (tableId) useMenuOrderingStore.getState().pickTable(tableId)
	}, [tableId])
	const tableIsEmpty = (table?.seated ?? 0) === 0

	const { data: orders = [] } = useGetOrders<OrderResponseDto[]>(
		{ tableId },
		{ query: { enabled: !!tableId, refetchInterval: TABLE_LIVE_REFETCH_MS } }
	)

	const orderedLines = useMemo(() => groupOrders(orders), [orders])

	const plan = useFoodWishes(tableId)
	const allergies = useMemo(() => allergyGroups(cart.people), [cart.people])
	// the plan tab's "add individual order" lands here with personal splits preselected
	const individual = useSearchParams()[0].get('split') === 'individual'

	const orderedByFood = useMemo(() => {
		const counts = new Map<string, number>()
		for (const o of orders)
			counts.set(o.foodId, (counts.get(o.foodId) ?? 0) + o.quantity)
		return counts
	}, [orders])

	const [activeFood, setActiveFood] = useState<FoodItemDto | null>(null)
	const [quickViewId, setQuickViewId] = useState<string | null>(null)
	const [panelTab, setPanelTab] = useState<SidePanelTab>('cart')
	const [sheetOpen, setSheetOpen] = useState(false)

	const selectSuggestion = (s: FoodSuggestionDto) => {
		const found = foods.find(f => f.id === s.id)
		setActiveFood(
			found ?? {
				id: s.id,
				name: s.name,
				imageUrl: s.imageUrl,
				description: null,
				categoryId: null,
				defaultVariantId: null,
				price: null,
				currency: null,
				isAvailable: true,
				isPopular: false,
				isRecommended: false,
				shouldCalculate: true,
				variantCount: 1,
			}
		)
	}

	const checkout = async () => {
		// land on what was just ordered so people can see it went through
		if (await cart.checkout()) setPanelTab('ordered')
	}

	const sidePanel = (
		<OrderSidePanel
			tab={panelTab}
			onTabChange={setPanelTab}
			cartCount={cart.itemCount}
			orderedCount={countDishes(orderedLines)}
			cart={
				<CartPanel
					lines={cart.lines}
					people={cart.people}
					myPersonId={cart.myPersonId}
					total={cart.total}
					currency={cart.currency}
					isPlacing={cart.isPlacing}
					onQuantityChange={cart.setQuantity}
					onModeChange={cart.setMode}
					onTogglePerson={cart.togglePerson}
					onVariantChange={cart.setVariant}
					onRemove={cart.remove}
					onClear={cart.clear}
					onCheckout={checkout}
				/>
			}
			ordered={<OrderedList lines={orderedLines} people={cart.people} />}
		/>
	)

	const openSheet = () => {
		setPanelTab(cart.itemCount > 0 ? 'cart' : 'ordered')
		setSheetOpen(true)
	}

	if (!canEdit) return <OrderLocked tableId={tableId} />
	if (!canAdd) return <OrderingClosed tableId={tableId} />

	return (
		<div className='mx-auto max-w-6xl px-4 py-6 lg:py-5 xl:max-w-[1400px]'>
			<div className='mb-4 flex flex-col gap-1 lg:mb-4 lg:flex-row lg:items-center lg:gap-3'>
				<Link
					to={`/tables/${tableId}`}
					className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<ArrowLeft className='size-4' />
					{t('orders.back_to_table')}
				</Link>
				{table ? (
					<h1 className='text-xl font-bold text-foreground'>
						{t('orders.ordering_for', { table: `${table.no}. ${table.name}` })}
					</h1>
				) : (
					tableLoading && <Skeleton className='mt-1 h-7 w-64 rounded-full' />
				)}
			</div>

			{tableIsEmpty ? (
				<div className='flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center'>
					<UserPlus className='size-8 text-muted-foreground' />
					<p className='text-sm font-medium text-foreground'>
						{t('orders.needs_people_title')}
					</p>
					<p className='max-w-sm text-sm text-muted-foreground'>
						{t('orders.needs_people_body')}
					</p>
					<Button asChild className='mt-1 gap-1.5 rounded-full'>
						<Link to={`/tables/${tableId}`}>
							<UserPlus className='size-4' />
							{t('orders.seat_someone')}
						</Link>
					</Button>
				</div>
			) : (
				<div className='flex items-start gap-6'>
					<aside className='hidden w-60 shrink-0 xl:sticky xl:top-20 xl:block'>
						<FilterSidebar
							search={search}
							onSearchChange={setSearch}
							onSuggestionSelect={selectSuggestion}
							activeCategory={category}
							categories={categories}
							categoriesState={categoriesState}
							sort={sort}
							onSortChange={setSort}
							popular={popular}
							recommended={recommended}
							onFilterChange={setFilter}
							exclude={
								<ExcludeFilter
									filter={exclude}
									align='start'
									className='w-full'
								/>
							}
						/>
					</aside>

					<div className='flex min-w-0 flex-1 flex-col gap-4'>
						<div className='sticky top-14 z-20 -mx-4 xl:hidden'>
							<FilterBar
								search={search}
								onSearchChange={setSearch}
								onSuggestionSelect={selectSuggestion}
								activeCategory={category}
								categories={categories}
								categoriesState={categoriesState}
								sort={sort}
								onSortChange={setSort}
								popular={popular}
								recommended={recommended}
								onFilterChange={setFilter}
								exclude={<ExcludeFilter filter={exclude} />}
							/>
						</div>

						<WishlistStrip
							tableId={tableId}
							wishes={plan.wishes}
							cartLines={cart.lines}
							myPersonId={cart.myPersonId}
							people={cart.people}
							allergies={allergies.map(g => ({
								key: g.key,
								label:
									g.allergen === 'other' && g.label
										? g.label
										: t(`plan_board.allergen.${g.allergen}`),
								people: g.people,
							}))}
							onSelectFood={setQuickViewId}
							statusOf={wish =>
								wishStatus(wish, id => orderedByFood.has(id), cart.quantityOf)
							}
							isApplying={cart.isPlacing}
							onApply={cart.orderFromPlan}
						/>

						{isLoading ? (
							<ProductGridSkeleton count={pagination.count} />
						) : isError ? (
							<p className='py-16 text-center text-sm text-muted-foreground'>
								{t('tables.load_error')}
							</p>
						) : foods.length === 0 ? (
							<p className='py-16 text-center text-sm text-muted-foreground'>
								{t('menu.no_results')}
							</p>
						) : (
							<>
								<div
									aria-busy={isRefreshing}
									className={cn(
										'grid grid-cols-2 gap-3 transition-opacity sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3',
										isRefreshing && 'opacity-60'
									)}
								>
									{foods.map(food => (
										<ProductCard
											key={food.id}
											food={food}
											quantity={cart.quantityOf(food.id)}
											orderedQuantity={orderedByFood.get(food.id) ?? 0}
											onAdd={() => setActiveFood(food)}
											onQuantityChange={q => cart.setQuantity(food.id, q)}
											onQuickView={() => setQuickViewId(food.id)}
											wishKind={plan.wishOf(food.id)?.kind}
											wishMenu={
												food.defaultVariantId && (
													<WishMenu
														name={food.name}
														wish={plan.wishOf(food.id)}
														onPick={kind => plan.pick(food, kind)}
														onRemove={() => plan.removeFood(food.id)}
													/>
												)
											}
										/>
									))}
								</div>
								<div className='flex flex-col items-center gap-2 pb-20 lg:pb-4'>
									<PaginationBar pagination={pagination} />
									{total > 0 && (
										<p className='text-xs text-muted-foreground'>
											{t('menu.showing', {
												from: (pagination.page - 1) * pagination.count + 1,
												to: Math.min(pagination.page * pagination.count, total),
												total,
											})}
										</p>
									)}
								</div>
							</>
						)}
					</div>

					<aside className='hidden w-80 shrink-0 lg:sticky lg:top-20 lg:block xl:w-96'>
						<div className='scrollbar-thin max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-4 shadow-sm'>
							{sidePanel}
						</div>
					</aside>
				</div>
			)}

			{!tableIsEmpty && (cart.itemCount > 0 || orders.length > 0) && (
				<Button
					onClick={openSheet}
					className='fixed inset-x-4 bottom-4 z-30 mx-auto flex h-11 w-fit gap-2 rounded-full px-5 shadow-lg lg:hidden'
				>
					{cart.itemCount > 0 ? (
						<>
							<ShoppingCart className='size-4' />
							{t('orders.view_cart', { count: cart.itemCount })}
							<span className='font-semibold tabular-nums'>
								{cart.total.toFixed(2)} {cart.currency}
							</span>
						</>
					) : (
						<>
							<ReceiptText className='size-4' />
							{t('orders.view_ordered', { count: countDishes(orderedLines) })}
						</>
					)}
				</Button>
			)}

			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side='bottom'
					className='scrollbar-thin max-h-[85vh] overflow-y-auto rounded-t-3xl'
				>
					<SheetHeader>
						<SheetTitle className='sr-only'>{t('orders.cart')}</SheetTitle>
					</SheetHeader>
					<div className='px-4 pb-6'>{sidePanel}</div>
				</SheetContent>
			</Sheet>

			<AddToCartModal
				open={!!activeFood}
				onOpenChange={open => !open && setActiveFood(null)}
				food={activeFood}
				tableId={tableId}
				onAdd={cart.addConfigured}
				onAddToPlan={(food, variantId, kind, quantity, personIds) => {
					plan.addConfigured(food, variantId, kind, quantity, personIds)
					toast.success(
						t('plan_board.quick_added', {
							name: food.name,
							list: t(`plan_board.${kind}`),
						})
					)
				}}
				defaultMode={individual ? 'me' : 'table'}
			/>

			<FoodDetailModal
				id={quickViewId}
				onOpenChange={open => !open && setQuickViewId(null)}
			/>
		</div>
	)
}

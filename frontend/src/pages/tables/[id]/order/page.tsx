import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, ReceiptText, ShoppingCart, UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { PaginationBar } from '@/components/common/PaginationBar'
import { FilterBar } from '@/pages/menu/@FilterBar'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { useGetOrders } from '@/api/orders/orders'
import type { FoodItemDto, OrderResponseDto } from '@/api/model'
import { ProductCard } from './@ProductCard'
import { CartPanel } from './@CartPanel'
import { OrderedList } from './@OrderedList'
import { groupOrders } from '../@groupOrders'
import { OrderSidePanel, type SidePanelTab } from './@OrderSidePanel'
import { AddToCartModal } from './@AddToCartModal'
import { useTableOrdering } from './@useTableOrdering'
import { useOrderCart } from './@useOrderCart'

export default function TableOrderPage() {
	const { t } = useTranslation()
	const {
		tableId,
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
	} = useTableOrdering()
	const cart = useOrderCart(tableId)
	const tableIsEmpty = (table?.seated ?? 0) === 0

	const { data: orders = [] } = useGetOrders<OrderResponseDto[]>(
		{ tableId },
		{ query: { enabled: !!tableId } }
	)

	const orderedLines = useMemo(() => groupOrders(orders), [orders])

	const orderedByFood = useMemo(() => {
		const counts = new Map<string, number>()
		for (const o of orders)
			counts.set(o.foodId, (counts.get(o.foodId) ?? 0) + o.quantity)
		return counts
	}, [orders])

	const [activeFood, setActiveFood] = useState<FoodItemDto | null>(null)
	const [panelTab, setPanelTab] = useState<SidePanelTab>('cart')
	const [sheetOpen, setSheetOpen] = useState(false)

	const checkout = async () => {
		// land on what was just ordered so people can see it went through
		if (await cart.checkout()) setPanelTab('ordered')
	}

	const sidePanel = (
		<OrderSidePanel
			tab={panelTab}
			onTabChange={setPanelTab}
			cartCount={cart.itemCount}
			orderedCount={orderedLines.length}
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

	return (
		<div className='mx-auto max-w-6xl px-4 py-6'>
			<div className='mb-4 flex flex-col gap-1'>
				<Link
					to={`/tables/${tableId}`}
					className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<ArrowLeft className='size-4' />
					{t('orders.back_to_table')}
				</Link>
				{table && (
					<h1 className='text-xl font-bold text-foreground'>
						{t('orders.ordering_for', { table: `${table.no}. ${table.name}` })}
					</h1>
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
				<div className='flex gap-6'>
					<div className='flex min-w-0 flex-1 flex-col gap-4'>
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

						{isLoading ? (
							<div className='flex justify-center py-16'>
								<Spinner />
							</div>
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
								<div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3'>
									{foods.map(food => (
										<ProductCard
											key={food.id}
											food={food}
											quantity={cart.quantityOf(food.id)}
											orderedQuantity={orderedByFood.get(food.id) ?? 0}
											onAdd={() => setActiveFood(food)}
											onQuantityChange={q => cart.setQuantity(food.id, q)}
										/>
									))}
								</div>
								<div className='flex justify-center pb-20 lg:pb-0'>
									<PaginationBar pagination={pagination} />
								</div>
							</>
						)}
					</div>

					<aside className='hidden w-80 shrink-0 lg:block'>
						<div className='scrollbar-thin sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm'>
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
							{t('orders.view_ordered', { count: orderedLines.length })}
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
			/>
		</div>
	)
}

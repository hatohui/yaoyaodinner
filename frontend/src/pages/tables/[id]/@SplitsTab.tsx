import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ReceiptText, Users } from 'lucide-react'
import { getGetOrdersQueryOptions } from '@/api/orders/orders'
import { getGetPresetMenusQueryOptions } from '@/api/preset-menus/preset-menus'
import type {
	OrderResponseDto,
	PersonDto,
	PresetMenuDto,
	TableDto,
} from '@/api/model'
import { Badge } from '@/components/ui/badge'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { SPLIT_VIEW_STORAGE_KEY } from '@/common/constants'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { localStorage } from '@/utils/localstorage'
import { allocateCents, awaitingPrice, billingCurrency } from '@/utils/money'
import { PriceEstimateNote } from '@/components/ordering/PriceEstimateNote'
import { cn } from '@/utils/shadcn'
import { TabEmptyState } from './@TabEmptyState'
import { SplitsSkeleton } from './@Skeletons'
import { SplitBreakdown, type SplitRound } from './@SplitBreakdown'
import { SplitReceipt } from './@SplitReceipt'

interface SplitsTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
}

type SplitView = 'people' | 'receipt'

export function SplitsTab({ table, people, canEdit }: SplitsTabProps) {
	const { t, i18n } = useTranslation()
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
		null
	)
	const [view, setViewState] = useState<SplitView>(() =>
		localStorage.load(SPLIT_VIEW_STORAGE_KEY) === 'receipt'
			? 'receipt'
			: 'people'
	)
	const setView = (next: SplitView) => {
		localStorage.save(SPLIT_VIEW_STORAGE_KEY, next)
		setViewState(next)
	}

	const { data: orders = [], isLoading: ordersLoading } = useQuery(
		getGetOrdersQueryOptions<OrderResponseDto[]>({
			tableId: table.id,
			lang: i18n.language,
		})
	)
	const { data: presets = [], isLoading: presetsLoading } = useQuery(
		getGetPresetMenusQueryOptions<PresetMenuDto[]>({
			lang: i18n.language,
			eventId: table.eventId ?? undefined,
		})
	)

	const activePreset = presets.find(p => p.isActive)
	const flatPrice = activePreset?.price ?? 0
	const flatShare = flatPrice / Math.max(people.length, 1)
	const currency = billingCurrency([...orders, ...(activePreset?.items ?? [])])

	const lineShare = (order: OrderResponseDto) => {
		const lineTotal = order.price * order.quantity
		if (order.splitAll) return lineTotal / Math.max(people.length, 1)
		return lineTotal / (order.splits.length || 1)
	}

	const shareOf = (items: OrderResponseDto[]) =>
		items.reduce((sum, o) => (o.shouldCalculate ? sum + lineShare(o) : sum), 0)

	const exact = people.map(person => {
		const items = orders.filter(
			o => o.splitAll || o.splits.some(s => s.personId === person.id)
		)
		const rounds: SplitRound[] = [
			{
				key: 'pre',
				label: t('orders.round_pre'),
				items: items.filter(o => o.round === 'pre'),
			},
			{
				key: 'dinner',
				label: t('orders.round_dinner'),
				items: items.filter(o => o.round === 'dinner'),
			},
		]
			.filter(r => r.items.length > 0)
			.map(r => ({ ...r, subtotal: shareOf(r.items) }))
		return { person, rounds, total: shareOf(items) + flatShare }
	})
	// rounded per person so the shares always add up to the table total
	const rounded = allocateCents(exact.map(b => b.total))
	const breakdown = exact.map((b, i) => ({ ...b, total: rounded[i] }))
	const tableTotal = rounded.reduce((sum, v) => sum + v, 0)

	const mine = breakdown.find(b => b.person.id === myPersonId)
	const others = breakdown.filter(b => b.person.id !== myPersonId)

	const toggle = (personId: string) =>
		setExpanded(prev => {
			const next = new Set(prev)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return next
		})

	if (ordersLoading || presetsLoading) {
		return <SplitsSkeleton rows={Math.min(Math.max(people.length, 2), 6)} />
	}

	if (orders.length === 0 && flatPrice === 0) {
		return (
			<TabEmptyState
				message={t('split.empty')}
				tableId={table.id}
				canEdit={canEdit}
			/>
		)
	}

	const viewOptions = [
		{ value: 'people', icon: Users, label: t('split.view_people') },
		{ value: 'receipt', icon: ReceiptText, label: t('split.view_receipt') },
	] as const

	return (
		<>
			<div className='mb-3 flex justify-end'>
				<div
					role='group'
					className='flex w-full items-center gap-1 rounded-full border border-border bg-card p-0.5 shadow-xs sm:w-auto'
				>
					{viewOptions.map(({ value, icon: Icon, label }) => (
						<button
							key={value}
							type='button'
							aria-pressed={view === value}
							onClick={() => setView(value)}
							className={cn(
								'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:py-1',
								view === value
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							<Icon className='size-3.5' />
							{label}
						</button>
					))}
				</div>
			</div>

			{view === 'receipt' ? (
				<SplitReceipt
					tableName={table.name}
					orders={orders}
					flatPrice={flatPrice}
					total={tableTotal}
					currency={currency}
					people={breakdown.map(b => ({
						id: b.person.id,
						name: b.person.name,
						amount: b.total,
					}))}
					myPersonId={myPersonId}
				/>
			) : (
				<div className='flex flex-col gap-3'>
					{mine && (
						<section className='flex flex-col gap-2 rounded-2xl border-2 border-primary bg-card p-4 shadow-sm'>
							<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{t('split.your_share')}
							</span>
							<span className='text-3xl font-extrabold tracking-tight tabular-nums text-foreground'>
								{mine.total.toFixed(2)}{' '}
								<span className='text-base font-semibold text-muted-foreground'>
									{currency}
								</span>
							</span>
							<div className='border-t border-dashed border-border pt-2'>
								<SplitBreakdown
									rounds={mine.rounds}
									flatShare={flatShare}
									currency={currency}
									lineShare={lineShare}
									onSelect={setSelectedOrder}
								/>
							</div>
						</section>
					)}

					<div className='flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-xs'>
						<span>{t('split.table_total')}</span>
						<span className='tabular-nums'>
							{tableTotal.toFixed(2)} {currency}
						</span>
					</div>

					{others.length > 0 && (
						<section className='flex flex-col gap-1.5'>
							<h3 className='m-0 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{mine ? t('split.everyone_else') : t('split.everyone')}
							</h3>
							<ul className='m-0 flex list-none flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xs'>
								{others.map(({ person, rounds, total }) => {
									const isOpen = expanded.has(person.id)
									return (
										<li key={person.id}>
											<button
												type='button'
												aria-expanded={isOpen}
												onClick={() => toggle(person.id)}
												className='flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none'
											>
												<span className='truncate font-medium text-foreground'>
													{person.name}
												</span>
												<span className='flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums text-foreground'>
													{total.toFixed(2)} {currency}
													<ChevronDown
														className={cn(
															'size-4 text-muted-foreground transition-transform',
															isOpen && 'rotate-180'
														)}
													/>
												</span>
											</button>
											{isOpen && (
												<div className='px-3 pb-3'>
													<SplitBreakdown
														rounds={rounds}
														flatShare={flatShare}
														currency={currency}
														lineShare={lineShare}
														onSelect={setSelectedOrder}
													/>
												</div>
											)}
										</li>
									)
								})}
							</ul>
						</section>
					)}
				</div>
			)}

			<PriceEstimateNote lines={orders} className='mt-3 px-1' />

			<Dialog
				open={selectedOrder !== null}
				onOpenChange={open => !open && setSelectedOrder(null)}
			>
				<DialogContent className='sm:max-w-sm [&>*]:min-w-0'>
					{selectedOrder && (
						<>
							<DialogHeader>
								<div className='flex items-center gap-3'>
									<OrderThumb
										imageKey={selectedOrder.foodImageUrl}
										alt={selectedOrder.foodName}
									/>
									<div className='flex min-w-0 flex-col'>
										<DialogTitle className='line-clamp-2 break-words text-base'>
											{selectedOrder.foodName}
										</DialogTitle>
										{selectedOrder.variantLabel && (
											<DialogDescription>
												{selectedOrder.variantLabel}
											</DialogDescription>
										)}
									</div>
								</div>
							</DialogHeader>

							<div className='flex flex-col gap-2 text-sm'>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>
										{t('split.quantity')}
									</span>
									<span className='font-medium text-foreground'>
										{selectedOrder.quantity}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>
										{t('split.your_share')}
									</span>
									<span className='flex items-center gap-1.5 font-semibold tabular-nums text-foreground'>
										{awaitingPrice(selectedOrder)
											? t('menu.seasonal_price')
											: `${(selectedOrder.shouldCalculate ? lineShare(selectedOrder) : 0).toFixed(2)} ${currency}`}
										{!selectedOrder.shouldCalculate && (
											<Badge className='rounded-full border-border bg-muted px-1.5 py-0 text-[10px] text-muted-foreground'>
												{t('split.free_badge')}
											</Badge>
										)}
									</span>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}

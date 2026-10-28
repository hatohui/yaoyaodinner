import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { cn } from '@/utils/shadcn'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TabEmptyState } from './@TabEmptyState'
import { SplitsSkeleton } from './@Skeletons'

interface SplitsTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
}

export function SplitsTab({ table, people, canEdit }: SplitsTabProps) {
	const { t, i18n } = useTranslation()
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
		null
	)
	const { data: orders = [], isLoading: ordersLoading } = useQuery(
		getGetOrdersQueryOptions<OrderResponseDto[]>({
			tableId: table.id,
			lang: i18n.language,
		})
	)

	const { data: presets = [], isLoading: presetsLoading } = useQuery(
		getGetPresetMenusQueryOptions<PresetMenuDto[]>({ lang: i18n.language })
	)
	const flatPrice = presets.find(p => p.isActive)?.price ?? 0
	const flatShare = flatPrice / Math.max(people.length, 1)
	const currency =
		orders[0]?.currency ?? presets.find(p => p.isActive)?.items[0]?.currency

	const lineShare = (order: OrderResponseDto) => {
		const lineTotal = order.price * order.quantity
		if (order.splitAll) return lineTotal / Math.max(people.length, 1)
		const n = order.splits.length || 1
		return lineTotal / n
	}

	const toggle = (personId: string) => {
		setExpanded(prev => {
			const next = new Set(prev)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return next
		})
	}

	const shareOf = (items: OrderResponseDto[]) =>
		items.reduce((sum, o) => (o.shouldCalculate ? sum + lineShare(o) : sum), 0)

	const breakdown = people.map(person => {
		const items = orders.filter(
			(o: OrderResponseDto) =>
				o.splitAll || o.splits.some(s => s.personId === person.id)
		)
		const rounds = [
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
	const tableTotal = breakdown.reduce((sum, b) => sum + b.total, 0)

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

	return (
		<>
			<div className='mb-2 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground'>
				<span>{t('split.table_total')}</span>
				<span className='tabular-nums'>
					{tableTotal.toFixed(2)} {currency}
				</span>
			</div>
			<ul className='flex flex-col gap-2'>
				{breakdown.map(({ person, rounds, total }) => {
					const isOpen = expanded.has(person.id)
					return (
						<li
							key={person.id}
							className='rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm'
						>
							<button
								type='button'
								onClick={() => toggle(person.id)}
								className='flex w-full cursor-pointer items-center justify-between gap-2'
							>
								<span className='font-medium text-foreground'>
									{person.name}
									{person.id === myPersonId && (
										<span className='ml-1.5 text-xs font-normal text-muted-foreground'>
											{t('split.you')}
										</span>
									)}
								</span>
								<span className='flex items-center gap-1.5'>
									<span className='text-sm font-medium text-foreground'>
										{total.toFixed(2)} {currency}
									</span>
									<ChevronDown
										className={cn(
											'size-4 text-muted-foreground transition-transform',
											isOpen && 'rotate-180'
										)}
									/>
								</span>
							</button>

							{isOpen && (
								<ul className='mt-2.5 flex flex-col gap-1 border-t border-border/60 pt-2.5'>
									{flatPrice > 0 && (
										<li className='flex items-center justify-between gap-2 px-1.5 py-1.5 text-sm font-medium text-foreground'>
											<span>{t('split.set_menu')}</span>
											<span>
												{flatShare.toFixed(2)} {currency}
											</span>
										</li>
									)}
									{rounds.map(r => (
										<li key={r.key} className='flex flex-col gap-1'>
											<div className='flex items-center justify-between gap-2 px-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
												<span>{r.label}</span>
												<span className='tabular-nums'>
													{r.subtotal.toFixed(2)} {currency}
												</span>
											</div>
											<ul className='flex flex-col gap-1'>
												{r.items.map(o => (
													<li key={o.id}>
														<button
															type='button'
															onClick={() => setSelectedOrder(o)}
															className='flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-muted/60'
														>
															<OrderThumb
																imageKey={o.foodImageUrl}
																alt={o.foodName}
															/>
															<span
																className={cn(
																	'flex min-w-0 flex-1 flex-col',
																	!o.shouldCalculate && 'opacity-50'
																)}
															>
																<span
																	className={cn(
																		'truncate text-sm font-medium',
																		o.shouldCalculate
																			? 'text-foreground'
																			: 'italic text-foreground'
																	)}
																>
																	{o.quantity > 1 && `x${o.quantity} `}
																	{o.foodName}
																</span>
																<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
																	{o.variantLabel}
																	{!o.shouldCalculate && (
																		<Badge className='rounded-full border-accent/30 bg-accent/15 px-1.5 py-0 text-[10px] text-accent'>
																			{t('split.free_badge')}
																		</Badge>
																	)}
																</span>
															</span>
															<span
																className={cn(
																	'shrink-0 text-sm font-medium',
																	o.shouldCalculate
																		? 'text-foreground'
																		: 'text-muted-foreground/50'
																)}
															>
																{o.shouldCalculate
																	? lineShare(o).toFixed(2)
																	: '0.00'}{' '}
																{o.currency}
															</span>
															<ChevronRight className='size-4 shrink-0 text-muted-foreground/60' />
														</button>
													</li>
												))}
											</ul>
										</li>
									))}
								</ul>
							)}
						</li>
					)
				})}
			</ul>

			<Dialog
				open={selectedOrder !== null}
				onOpenChange={open => !open && setSelectedOrder(null)}
			>
				<DialogContent className='sm:max-w-sm'>
					{selectedOrder && (
						<>
							<DialogHeader>
								<div className='flex items-center gap-3'>
									<OrderThumb
										imageKey={selectedOrder.foodImageUrl}
										alt={selectedOrder.foodName}
									/>
									<div className='flex min-w-0 flex-col'>
										<DialogTitle className='truncate'>
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
									<span className='flex items-center gap-1.5 font-semibold text-foreground'>
										{selectedOrder.shouldCalculate
											? lineShare(selectedOrder).toFixed(2)
											: '0.00'}{' '}
										{selectedOrder.currency}
										{!selectedOrder.shouldCalculate && (
											<Badge className='rounded-full border-accent/30 bg-accent/15 px-1.5 py-0 text-[10px] text-accent'>
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

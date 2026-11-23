import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { awaitingPrice } from '@/utils/money'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { PriceEstimateNote } from '@/components/ordering/PriceEstimateNote'
import { cn } from '@/utils/shadcn'
import { TabEmptyState } from './@TabEmptyState'
import { SplitsSkeleton } from './@Skeletons'
import { SplitBreakdown } from './@SplitBreakdown'
import { SplitReceipt } from './@SplitReceipt'
import { useSplitShares } from './@useSplitShares'

export type SplitView = 'people' | 'receipt'

interface SplitsTabProps {
	table: TableDto
	people: PersonDto[]
	canEdit: boolean
	view: SplitView
}

export function SplitsTab({ table, people, canEdit, view }: SplitsTabProps) {
	const { t } = useTranslation()
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
		null
	)

	const {
		orders,
		isLoading,
		myPersonId,
		flatPrice,
		flatShare,
		currency,
		lineShare,
		breakdown,
		tableTotal,
		tablePartial,
		mine,
		others,
	} = useSplitShares(table, people)

	const toggle = (personId: string) =>
		setExpanded(prev => {
			const next = new Set(prev)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return next
		})

	if (isLoading) {
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
			{view === 'receipt' ? (
				<SplitReceipt
					tableName={table.name}
					orders={orders}
					flatPrice={flatPrice}
					total={tableTotal}
					partial={tablePartial}
					currency={currency}
					people={breakdown.map(b => ({
						id: b.person.id,
						name: b.person.name,
						amount: b.total,
						partial: b.partial,
					}))}
					myPersonId={myPersonId}
				/>
			) : (
				<div
					className={
						mine && others.length > 0
							? 'flex flex-col gap-3 lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-5'
							: 'flex flex-col gap-3'
					}
				>
					<div className='flex flex-col gap-3 lg:sticky lg:top-20'>
						{mine && (
							<section className='flex flex-col gap-2 rounded-2xl border-2 border-primary bg-card p-4 shadow-sm'>
								<span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									{t('split.your_share')}
									{mine.partial && ` · ${t('menu.price_from')}`}
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
								<div className='flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground'>
									<span>{t('split.table_total')}</span>
									<span className='tabular-nums'>
										<TotalAmount
											amount={tableTotal}
											currency={currency}
											partial={tablePartial}
										/>
									</span>
								</div>
							</section>
						)}

						{!mine && (
							<div className='flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-xs'>
								<span>{t('split.table_total')}</span>
								<span className='tabular-nums'>
									<TotalAmount
										amount={tableTotal}
										currency={currency}
										partial={tablePartial}
									/>
								</span>
							</div>
						)}
					</div>

					{others.length > 0 && (
						<section className='flex flex-col gap-1.5'>
							<h3 className='m-0 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{mine ? t('split.everyone_else') : t('split.everyone')}
							</h3>
							<ul className='m-0 flex list-none flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xs'>
								{others.map(({ person, rounds, total, partial }) => {
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
													<TotalAmount
														amount={total}
														currency={currency}
														partial={partial}
													/>
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

			<PriceEstimateNote className='mt-3 px-1' />

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

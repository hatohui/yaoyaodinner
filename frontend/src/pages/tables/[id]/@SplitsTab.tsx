import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getGetOrdersQueryOptions } from '@/api/orders/orders'
import type { OrderResponseDto, PersonDto, TableDto } from '@/api/model'
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
import { OrderThumb } from './@OrderThumb'

interface SplitsTabProps {
	table: TableDto
	people: PersonDto[]
}

export function SplitsTab({ table, people }: SplitsTabProps) {
	const { t, i18n } = useTranslation()
	const { personId: myPersonId } = useWhoAmI(table.id)
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(
		null
	)
	const { data: orders = [] } = useQuery(
		getGetOrdersQueryOptions<OrderResponseDto[]>({
			tableId: table.id,
			lang: i18n.language,
		})
	)

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

	const breakdown = people.map(person => {
		const items = orders.filter(
			(o: OrderResponseDto) =>
				o.splitAll || o.splits.some(s => s.personId === person.id)
		)
		const total = items.reduce(
			(sum, o) => (o.shouldCalculate ? sum + lineShare(o) : sum),
			0
		)
		return { person, items, total }
	})

	if (orders.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('split.empty')}
			</p>
		)
	}

	return (
		<>
			<ul className='flex flex-col gap-2'>
				{breakdown.map(({ person, items, total }) => {
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
										{total.toFixed(2)} {items[0]?.currency}
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
									{items.map(o => (
										<li key={o.id}>
											<button
												type='button'
												onClick={() => setSelectedOrder(o)}
												className='flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-muted/60'
											>
												<OrderThumb imageKey={o.foodImageUrl} alt={o.foodName} />
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
													{o.shouldCalculate ? lineShare(o).toFixed(2) : '0.00'}{' '}
													{o.currency}
												</span>
												<ChevronRight className='size-4 shrink-0 text-muted-foreground/60' />
											</button>
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

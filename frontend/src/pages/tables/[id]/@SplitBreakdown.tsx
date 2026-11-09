import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { OrderResponseDto } from '@/api/model'
import { Badge } from '@/components/ui/badge'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { awaitingPrice } from '@/utils/money'
import { cn } from '@/utils/shadcn'

export interface SplitRound {
	key: string
	label: string
	items: OrderResponseDto[]
	subtotal: number
	partial: boolean
}

interface SplitBreakdownProps {
	rounds: SplitRound[]
	flatShare: number
	currency: string
	lineShare: (order: OrderResponseDto) => number
	onSelect: (order: OrderResponseDto) => void
}

/** One person's part of the bill: the set menu share, then each round's items. */
export function SplitBreakdown({
	rounds,
	flatShare,
	currency,
	lineShare,
	onSelect,
}: SplitBreakdownProps) {
	const { t } = useTranslation()
	// with one round and no set menu, the subtotal is just the person's total again
	const showSubtotals = rounds.length > 1 || flatShare > 0

	return (
		<ul className='flex flex-col gap-1'>
			{flatShare > 0 && (
				<li className='flex items-center justify-between gap-2 px-1.5 py-1.5 text-sm font-medium text-foreground'>
					<span>{t('split.set_menu')}</span>
					<span className='tabular-nums'>
						{flatShare.toFixed(2)} {currency}
					</span>
				</li>
			)}
			{rounds.map(r => (
				<li key={r.key} className='flex flex-col gap-1'>
					<div className='flex items-center justify-between gap-2 px-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						<span>{r.label}</span>
						{showSubtotals && (
							<span className='tabular-nums'>
								<TotalAmount
									amount={r.subtotal}
									currency={currency}
									partial={r.partial}
								/>
							</span>
						)}
					</div>
					<ul className='flex flex-col gap-1'>
						{r.items.map(o => (
							<li key={o.id}>
								<button
									type='button'
									onClick={() => onSelect(o)}
									className='flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
								>
									<OrderThumb imageKey={o.foodImageUrl} alt={o.foodName} />
									<span className='flex min-w-0 flex-1 flex-col'>
										<span
											className={cn(
												'truncate text-sm font-medium',
												o.shouldCalculate
													? 'text-foreground'
													: 'text-muted-foreground'
											)}
										>
											{o.quantity > 1 && `x${o.quantity} `}
											{o.foodName}
										</span>
										<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
											{o.variantLabel}
											{!o.shouldCalculate && (
												<Badge className='rounded-full border-border bg-muted px-1.5 py-0 text-[10px] text-muted-foreground'>
													{t('split.free_badge')}
												</Badge>
											)}
										</span>
									</span>
									<span
										className={cn(
											'shrink-0 text-sm font-medium tabular-nums',
											o.shouldCalculate
												? 'text-foreground'
												: 'text-muted-foreground'
										)}
									>
										{awaitingPrice(o)
											? t('menu.seasonal_price')
											: `${(o.shouldCalculate ? lineShare(o) : 0).toFixed(2)} ${currency}`}
									</span>
									<ChevronRight className='size-4 shrink-0 text-muted-foreground/60' />
								</button>
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	)
}

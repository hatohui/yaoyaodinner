import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { TablePlanItemDto } from '@/api/model'
import { OrderThumb } from '@/components/ordering/OrderThumb'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { cn } from '@/utils/shadcn'

interface PlanDishRowProps {
	item: TablePlanItemDto
	/** How this changes what the table ordered; left out for a fresh plan. */
	change?: number
	onSelect: () => void
}

export function PlanDishRow({ item, change, onSelect }: PlanDishRowProps) {
	const { t } = useTranslation()
	const badge = !change
		? null
		: change === item.quantity
			? t('table_plan.change_new')
			: change > 0
				? `+${change}`
				: `−${-change}`
	return (
		<li>
			<button
				type='button'
				onClick={onSelect}
				className='group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted'
			>
				<OrderThumb
					imageKey={item.imageUrl}
					alt={item.name}
					className='size-12'
				/>
				<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
					<p className='text-sm font-medium text-foreground'>
						<span className='tabular-nums text-primary'>{item.quantity}×</span>{' '}
						{item.name}
						{item.label && (
							<span className='text-muted-foreground'> · {item.label}</span>
						)}
						{badge && (
							<span
								className={cn(
									'ml-1.5 rounded-full px-1.5 py-px text-[0.7rem] font-semibold tabular-nums',
									change! > 0
										? 'bg-primary/15 text-primary'
										: 'bg-destructive/15 text-destructive'
								)}
							>
								{badge}
							</span>
						)}
					</p>
					{item.reason && (
						<p className='line-clamp-2 text-xs text-muted-foreground'>
							{item.reason}
						</p>
					)}
				</div>
				<span className='shrink-0 text-sm tabular-nums text-foreground'>
					{!item.shouldCalculate ? (
						t('orders.free_badge')
					) : item.price === null ? (
						t('table_plan.price_pending')
					) : (
						<TotalAmount
							amount={item.price * item.quantity}
							currency={item.currency}
						/>
					)}
				</span>
				<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
			</button>
		</li>
	)
}

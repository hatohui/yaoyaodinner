import { useTranslation } from 'react-i18next'
import type { PersonDto } from '@/api/model'
import { OrderThumb } from '../@OrderThumb'
import type { OrderedLine } from '../@groupOrders'

interface OrderedListProps {
	lines: OrderedLine[]
	people: PersonDto[]
}

export function OrderedList({ lines, people }: OrderedListProps) {
	const { t } = useTranslation()

	if (lines.length === 0) {
		return (
			<p className='rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground'>
				{t('orders.empty')}
			</p>
		)
	}

	const total = lines.reduce(
		(sum, o) => (o.shouldCalculate ? sum + o.price * o.quantity : sum),
		0
	)
	const currency = lines.find(o => o.currency)?.currency ?? ''

	return (
		<div className='flex flex-col gap-3'>
			<ul className='flex flex-col gap-2'>
				{lines.map(order => {
					const names = order.splits.map(
						s =>
							people.find(p => p.id === s.personId)?.name ??
							t('orders.unknown_person')
					)
					return (
						<li
							key={order.key}
							className='flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5'
						>
							<OrderThumb imageKey={order.foodImageUrl} alt={order.foodName} />
							<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
								<span className='truncate text-sm font-medium text-foreground'>
									{order.foodName}
								</span>
								{order.variantLabel && (
									<span className='truncate text-xs text-muted-foreground'>
										{order.variantLabel}
									</span>
								)}
								<span className='truncate text-xs text-primary'>
									{order.splitAll
										? t('split.whole_table')
										: names.join(', ') || t('orders.personal')}
								</span>
							</div>
							<div className='flex shrink-0 flex-col items-end gap-0.5 text-sm'>
								<span className='font-semibold tabular-nums text-foreground'>
									×{order.quantity}
								</span>
								<span className='text-xs tabular-nums text-muted-foreground'>
									{order.shouldCalculate
										? `${(order.price * order.quantity).toFixed(2)} ${order.currency}`
										: t('orders.free')}
								</span>
							</div>
						</li>
					)
				})}
			</ul>
			<div className='flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-foreground'>
				<span>{t('orders.total')}</span>
				<span className='tabular-nums'>
					{total.toFixed(2)} {currency}
				</span>
			</div>
		</div>
	)
}

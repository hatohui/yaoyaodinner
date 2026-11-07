import { useTranslation } from 'react-i18next'
import type { PersonDto } from '@/api/model'
import { OrderThumb } from './OrderThumb'
import { dishKey, type OrderedLine } from '@/components/ordering/groupOrders'
import { billingCurrency } from '@/utils/money'

interface OrderedListProps {
	lines: OrderedLine[]
	people: PersonDto[]
}

interface DishGroup {
	key: string
	head: OrderedLine
	lines: OrderedLine[]
	quantity: number
	total: number
}

/** One entry per dish and portion, so repeat orders read as one item split several ways. */
const groupByDish = (lines: OrderedLine[]): DishGroup[] => {
	const groups = new Map<string, DishGroup>()
	for (const line of lines) {
		const key = dishKey(line)
		const amount = line.shouldCalculate ? line.price * line.quantity : 0
		const group = groups.get(key)
		if (group) {
			group.lines.push(line)
			group.quantity += line.quantity
			group.total += amount
		} else
			groups.set(key, {
				key,
				head: line,
				lines: [line],
				quantity: line.quantity,
				total: amount,
			})
	}
	return [...groups.values()]
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

	const currency = billingCurrency(lines)
	const groups = groupByDish(lines)
	const total = groups.reduce((sum, g) => sum + g.total, 0)

	const splitLabel = (line: OrderedLine) => {
		if (line.splitAll) return t('split.whole_table')
		const names = line.splits.map(
			s =>
				people.find(p => p.id === s.personId)?.name ??
				t('orders.unknown_person')
		)
		return names.join(', ') || t('orders.personal')
	}

	const amount = (value: number, free: boolean) =>
		free
			? t('orders.free')
			: value > 0
				? `${value.toFixed(2)} ${currency}`
				: t('menu.seasonal_price')

	return (
		<div className='flex flex-col gap-3'>
			<ul className='flex flex-col gap-2'>
				{groups.map(({ key, head, lines: parts, quantity, total: sum }) => {
					const free = !head.shouldCalculate
					const single = parts.length === 1
					return (
						<li
							key={key}
							className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-2.5'
						>
							<div className='flex items-center gap-3'>
								<OrderThumb imageKey={head.foodImageUrl} alt={head.foodName} />
								<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
									<span
										title={head.foodName}
										className='truncate text-sm font-medium text-foreground'
									>
										{head.foodName}
									</span>
									{head.variantLabel && (
										<span className='truncate text-xs text-muted-foreground'>
											{head.variantLabel}
										</span>
									)}
									{single && (
										<span className='truncate text-xs text-primary'>
											{splitLabel(head)}
										</span>
									)}
								</div>
								<div className='flex shrink-0 flex-col items-end gap-0.5 text-sm'>
									<span className='font-semibold tabular-nums text-foreground'>
										×{quantity}
									</span>
									<span className='text-xs tabular-nums text-muted-foreground'>
										{amount(sum, free)}
									</span>
								</div>
							</div>

							{!single && (
								<ul className='m-0 flex list-none flex-col gap-1 border-t border-border/60 p-0 pt-2'>
									{parts.map(part => (
										<li
											key={part.key}
											className='flex items-center justify-between gap-2 px-1 text-xs'
										>
											<span className='min-w-0 truncate text-primary'>
												{splitLabel(part)}
											</span>
											<span className='flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground'>
												<span className='font-semibold text-foreground'>
													×{part.quantity}
												</span>
												{amount(part.price * part.quantity, free)}
											</span>
										</li>
									))}
								</ul>
							)}
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

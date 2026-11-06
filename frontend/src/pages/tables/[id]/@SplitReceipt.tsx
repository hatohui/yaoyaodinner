import { useTranslation } from 'react-i18next'
import type { OrderResponseDto } from '@/api/model'
import { groupOrders } from '@/components/ordering/groupOrders'
import { cn } from '@/utils/shadcn'

interface SplitReceiptProps {
	tableName: string
	orders: OrderResponseDto[]
	flatPrice: number
	total: number
	currency: string
	people: { id: string; name: string; amount: number }[]
	myPersonId: string | null
}

/** The bill as a receipt: what was ordered, the total, then who pays what. */
export function SplitReceipt({
	tableName,
	orders,
	flatPrice,
	total,
	currency,
	people,
	myPersonId,
}: SplitReceiptProps) {
	const { t } = useTranslation()
	const lines = groupOrders(orders)

	return (
		<div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-sm sm:p-5'>
			<p className='m-0 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground'>
				{t('split.bill_title', { table: tableName })}
			</p>

			<ul className='m-0 flex list-none flex-col gap-1.5 p-0'>
				{flatPrice > 0 && (
					<li className='flex justify-between gap-3'>
						<span>{t('split.set_menu')}</span>
						<span className='tabular-nums'>{flatPrice.toFixed(2)}</span>
					</li>
				)}
				{lines.map(line => (
					<li
						key={line.key}
						className={cn(
							'flex justify-between gap-3',
							!line.shouldCalculate && 'text-muted-foreground'
						)}
					>
						<span className='min-w-0 truncate'>
							{line.quantity} × {line.foodName}
							{line.variantLabel && ` · ${line.variantLabel}`}
						</span>
						<span className='shrink-0 tabular-nums'>
							{line.shouldCalculate
								? (line.price * line.quantity).toFixed(2)
								: t('split.free_badge')}
						</span>
					</li>
				))}
			</ul>

			<div className='border-t border-dashed border-border' />
			<div className='flex justify-between gap-3 text-base font-bold'>
				<span>{t('split.total')}</span>
				<span className='tabular-nums'>
					{total.toFixed(2)} {currency}
				</span>
			</div>
			<div className='border-t border-dashed border-border' />

			<ul className='m-0 flex list-none flex-col gap-1 p-0'>
				{people.map(p => (
					<li
						key={p.id}
						className={cn(
							'flex justify-between gap-3',
							p.id === myPersonId && 'font-bold text-primary'
						)}
					>
						<span className='min-w-0 truncate'>
							{p.name}
							{p.id === myPersonId && ` (${t('split.you')})`}
						</span>
						<span className='tabular-nums'>{p.amount.toFixed(2)}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

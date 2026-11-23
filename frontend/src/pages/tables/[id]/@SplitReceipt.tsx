import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import type { OrderResponseDto } from '@/api/model'
import { groupOrders } from '@/components/ordering/groupOrders'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { Button } from '@/components/ui/button'
import { awaitingPrice } from '@/utils/money'
import { downloadReceiptImage } from '@/utils/receiptImage'
import { cn } from '@/utils/shadcn'

interface SplitReceiptProps {
	tableName: string
	orders: OrderResponseDto[]
	flatPrice: number
	total: number
	partial: boolean
	currency: string
	people: { id: string; name: string; amount: number; partial: boolean }[]
	myPersonId: string | null
}

/** The bill as a receipt: what was ordered, the total, then who pays what. */
export function SplitReceipt({
	tableName,
	orders,
	flatPrice,
	total,
	partial,
	currency,
	people,
	myPersonId,
}: SplitReceiptProps) {
	const { t } = useTranslation()
	const lines = groupOrders(orders).filter(line => line.shouldCalculate)

	const download = () => {
		const slug =
			tableName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') || 'table'
		downloadReceiptImage({
			filename: `${slug}-receipt.png`,
			title: t('split.bill_title', { table: tableName }),
			sections: [
				{
					rows: [
						...(flatPrice > 0
							? [{ left: t('split.set_menu'), right: flatPrice.toFixed(2) }]
							: []),
						...lines.map(line => ({
							left: `${line.quantity} × ${line.foodName}${line.variantLabel ? ` · ${line.variantLabel}` : ''}`,
							right: awaitingPrice(line)
								? t('menu.seasonal_price')
								: (line.price * line.quantity).toFixed(2),
						})),
					],
				},
				{
					rows: people.map(p => ({
						left: `${p.name}${p.id === myPersonId ? ` (${t('split.you')})` : ''}`,
						right: `${p.partial ? `${t('menu.price_from')} ` : ''}${p.amount.toFixed(2)}`,
						highlight: p.id === myPersonId,
					})),
				},
			],
			totalLabel: t('split.total'),
			totalValue:
				`${partial ? `${t('menu.price_from')} ` : ''}${total.toFixed(2)} ${currency}`.trim(),
			footer: t('orders.estimate_note'),
		})
	}

	return (
		<div className='mx-auto flex w-full max-w-md flex-col gap-2.5'>
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
						<li key={line.key} className='flex justify-between gap-3'>
							<span className='min-w-0 truncate'>
								{line.quantity} × {line.foodName}
								{line.variantLabel && ` · ${line.variantLabel}`}
							</span>
							<span className='shrink-0 tabular-nums'>
								{awaitingPrice(line)
									? t('menu.seasonal_price')
									: (line.price * line.quantity).toFixed(2)}
							</span>
						</li>
					))}
				</ul>

				<div className='border-t border-dashed border-border' />
				<div className='flex justify-between gap-3 text-base font-bold'>
					<span>{t('split.total')}</span>
					<span className='tabular-nums'>
						<TotalAmount amount={total} currency={currency} partial={partial} />
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
							<span className='tabular-nums'>
								<TotalAmount amount={p.amount} partial={p.partial} />
							</span>
						</li>
					))}
				</ul>
			</div>
			<Button
				variant='outline'
				size='sm'
				onClick={download}
				className='w-full gap-1.5 rounded-full'
			>
				<Download className='size-4' />
				{t('common.download_image')}
			</Button>
		</div>
	)
}

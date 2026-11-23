import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { PriceEstimateNote } from '@/components/ordering/PriceEstimateNote'

export interface OrdersSummaryData {
	total: number
	partial: boolean
	currency: string
	myShare?: { amount: number; partial: boolean }
}

interface OrdersSummaryProps {
	summary: OrdersSummaryData
	addOrderHref?: string
	onShowSplits: () => void
}

export function OrdersSummaryCard({
	summary,
	addOrderHref,
	onShowSplits,
}: OrdersSummaryProps) {
	const { t } = useTranslation()

	return (
		<section className='flex flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm'>
			<div className='flex items-baseline justify-between gap-2'>
				<span className='text-sm text-muted-foreground'>
					{t('orders.total')}
				</span>
				<span className='text-xl font-bold tabular-nums text-foreground'>
					<TotalAmount
						amount={summary.total}
						currency={summary.currency}
						partial={summary.partial}
					/>
				</span>
			</div>
			{summary.myShare && (
				<button
					type='button'
					onClick={onShowSplits}
					className='flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm transition-colors hover:bg-primary/15'
				>
					<span className='text-foreground'>{t('split.your_share')}</span>
					<span className='flex items-center gap-1 font-semibold tabular-nums text-primary'>
						<TotalAmount
							amount={summary.myShare.amount}
							currency={summary.currency}
							partial={summary.myShare.partial}
						/>
						<ChevronRight className='size-4' />
					</span>
				</button>
			)}
			{addOrderHref && (
				<Button asChild className='h-10 gap-1.5 rounded-xl'>
					<Link to={addOrderHref}>
						<Plus className='size-4' />
						{t('orders.add_order')}
					</Link>
				</Button>
			)}
			<PriceEstimateNote />
		</section>
	)
}

export function OrdersSummaryBar({
	summary,
	addOrderHref,
	onShowSplits,
}: OrdersSummaryProps) {
	const { t } = useTranslation()

	return (
		<div className='fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md'>
			<div className='mx-auto flex max-w-3xl items-center gap-3'>
				<div className='flex min-w-0 flex-col'>
					<span className='text-[11px] text-muted-foreground'>
						{t('orders.total')}
					</span>
					<span className='truncate text-sm font-semibold tabular-nums text-foreground'>
						<TotalAmount
							amount={summary.total}
							currency={summary.currency}
							partial={summary.partial}
						/>
					</span>
					{summary.myShare && (
						<button
							type='button'
							onClick={onShowSplits}
							className='w-fit cursor-pointer text-left text-[11px] tabular-nums text-primary'
						>
							{t('orders.you_pay', {
								amount: `${summary.myShare.amount.toFixed(2)} ${summary.currency}`,
							})}
						</button>
					)}
				</div>
				{addOrderHref && (
					<Button
						asChild
						className='ml-auto h-11 flex-1 gap-1.5 rounded-xl sm:max-w-64'
					>
						<Link to={addOrderHref}>
							<Plus className='size-4' />
							{t('orders.add_order')}
						</Link>
					</Button>
				)}
			</div>
		</div>
	)
}

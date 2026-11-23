import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TotalAmount } from '@/components/ordering/TotalAmount'
import { perPerson, type PendingPlan } from './@PlanApplyBar'

interface PlanReadyCardProps {
	pending: PendingPlan
	count: number
	headcount: number
	onApply: () => void
}

export function PlanReadyCard({
	pending,
	count,
	headcount,
	onApply,
}: PlanReadyCardProps) {
	const { t } = useTranslation()
	const share = perPerson(pending, headcount)
	const rows = [
		{ label: t('plan_board.must'), value: pending.must },
		{ label: t('plan_board.want'), value: pending.want },
		{ label: t('plan_board.ready_cart'), value: pending.cart },
	].filter(row => row.value > 0)

	return (
		<section className='flex flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm'>
			<h2 className='text-sm font-semibold text-foreground'>
				{t('plan_board.ready_title')}
			</h2>
			<dl className='flex flex-col divide-y divide-border/60 text-sm'>
				{rows.map(row => (
					<div key={row.label} className='flex justify-between py-1.5'>
						<dt className='text-muted-foreground'>{row.label}</dt>
						<dd className='tabular-nums text-foreground'>{row.value}</dd>
					</div>
				))}
				<div className='flex justify-between py-1.5'>
					<dt className='text-muted-foreground'>
						{t('plan_board.ready_total')}
					</dt>
					<dd className='font-semibold tabular-nums text-foreground'>
						<TotalAmount
							amount={pending.total}
							currency={pending.currency}
							partial={pending.partial}
						/>
					</dd>
				</div>
				{share && (
					<div className='flex justify-between py-1.5'>
						<dt className='text-muted-foreground'>
							{t('plan_board.per_person_label', { count: headcount })}
						</dt>
						<dd className='tabular-nums text-foreground'>{share}</dd>
					</div>
				)}
			</dl>
			<Button onClick={onApply} className='h-10 gap-1.5 rounded-xl'>
				<Zap className='size-4' />
				{t('plan_board.apply_plan', { count })}
			</Button>
		</section>
	)
}

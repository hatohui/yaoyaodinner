import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TotalAmount } from '@/components/ordering/TotalAmount'

export interface PendingPlan {
	must: number
	want: number
	cart: number
	total: number
	partial: boolean
	currency: string
}

export const perPerson = (pending: PendingPlan, headcount: number) =>
	headcount > 1 && pending.total > 0
		? `${(pending.total / headcount).toFixed(2)} ${pending.currency}`
		: null

interface PlanApplyBarProps {
	pending: PendingPlan
	count: number
	headcount: number
	onApply: () => void
}

export function PlanApplyBar({
	pending,
	count,
	headcount,
	onApply,
}: PlanApplyBarProps) {
	const { t } = useTranslation()
	const share = perPerson(pending, headcount)

	return (
		<div className='fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md'>
			<div className='mx-auto flex max-w-3xl items-center gap-3'>
				<div className='flex min-w-0 flex-col'>
					<span className='text-[11px] text-muted-foreground'>
						{t('plan_board.ready_total')}
					</span>
					<span className='truncate text-sm font-semibold tabular-nums text-foreground'>
						<TotalAmount
							amount={pending.total}
							currency={pending.currency}
							partial={pending.partial}
						/>
					</span>
					{share && (
						<span className='text-[11px] tabular-nums text-muted-foreground'>
							{t('plan_board.per_person', { amount: share })}
						</span>
					)}
				</div>
				<Button
					onClick={onApply}
					className='ml-auto h-11 flex-1 gap-1.5 rounded-xl sm:max-w-64'
				>
					<Zap className='size-4' />
					{t('plan_board.apply_plan', { count })}
				</Button>
			</div>
		</div>
	)
}

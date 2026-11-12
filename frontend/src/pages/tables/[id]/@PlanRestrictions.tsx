import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import type { TablePlanRestrictionDto } from '@/api/model'

interface PlanRestrictionsProps {
	restrictions: TablePlanRestrictionDto[]
	canDismiss: boolean
	disabled: boolean
	onDismiss: (id: string) => void
}

export function PlanRestrictions({
	restrictions,
	canDismiss,
	disabled,
	onDismiss,
}: PlanRestrictionsProps) {
	const { t } = useTranslation()
	if (restrictions.length === 0) return null

	return (
		<div className='flex flex-col gap-1.5 rounded-xl border border-border bg-muted p-3'>
			<p className='flex items-center gap-1.5 text-xs font-semibold text-foreground'>
				<ShieldAlert className='size-3.5 shrink-0 text-primary' />
				{t('table_plan.restrictions_title')}
			</p>
			<ul className='flex flex-col gap-1'>
				{restrictions.map(r => (
					<li
						key={r.id}
						className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground'
					>
						<span>
							<span className='font-semibold'>{r.guest}</span>: {r.label}
						</span>
						{!r.certain && (
							<>
								<span className='rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary'>
									{t('table_plan.unsure')}
								</span>
								{canDismiss && (
									<button
										type='button'
										disabled={disabled}
										onClick={() => onDismiss(r.id)}
										className='cursor-pointer text-[11px] text-foreground underline underline-offset-2 hover:text-primary disabled:cursor-wait'
									>
										{t('table_plan.not_restriction')}
									</button>
								)}
							</>
						)}
					</li>
				))}
			</ul>
			<p className='text-[11px] text-muted-foreground'>{t('table_plan.restrictions_body')}</p>
		</div>
	)
}

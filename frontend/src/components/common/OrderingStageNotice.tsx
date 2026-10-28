import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, Lock, UtensilsCrossed } from 'lucide-react'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { useStageTitle } from '@/hooks/useStageTitle'
import { formatEventTime } from '@/utils/eventTime'
import { cn } from '@/utils/shadcn'

const ICONS = {
	closed: Clock,
	open: Clock,
	confirmed: Lock,
	dinner: UtensilsCrossed,
	finalized: CheckCircle2,
}

/** What guests can do with orders right now; nothing while ordering is open with no deadline. */
export function OrderingStageNotice({ className }: { className?: string }) {
	const { t, i18n } = useTranslation()
	const { stage, deadline, dinnerTime, timezone } = useOrderingStage()
	const title = useStageTitle()
	const time = (iso: string) => formatEventTime(iso, timezone, i18n.language)

	const body = {
		closed: t('ordering.closed_body'),
		open: deadline ? t('ordering.open_body', { time: time(deadline) }) : '',
		confirmed: dinnerTime
			? t('ordering.confirmed_body_time', { time: time(dinnerTime) })
			: t('ordering.confirmed_body'),
		dinner: t('ordering.dinner_body'),
		finalized: t('ordering.finalized_body'),
	}[stage]
	if (!body) return null

	const Icon = ICONS[stage]

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-2xl border border-primary/35 bg-brand-muted px-4 py-3 shadow-2xs',
				className
			)}
		>
			<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary'>
				<Icon className='size-4' />
			</span>
			<div className='flex min-w-0 flex-col'>
				<span className='text-sm font-semibold text-foreground'>{title}</span>
				<span className='text-xs text-muted-foreground'>{body}</span>
			</div>
		</div>
	)
}

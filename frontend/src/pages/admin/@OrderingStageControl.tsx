import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Lock, ShoppingCart } from 'lucide-react'
import type { EventSummaryDto, StoredOrderingStage } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { formatEventTime } from '@/utils/eventTime'

interface OrderingStageControlProps {
	event: EventSummaryDto
	isLive: boolean
}

export function OrderingStageControl({
	event,
	isLive,
}: OrderingStageControlProps) {
	const { t, i18n } = useTranslation()
	const { setStage, settingStage } = useAdminEvents()
	const status = useOrderingStage()
	const [pending, setPending] = useState<StoredOrderingStage | null>(null)

	// only the live event's deadline and dinner time move it along on its own
	const stage = isLive ? status.stage : event.orderingStage
	const stored = event.orderingStage
	const time = (iso: string) =>
		formatEventTime(iso, status.timezone, i18n.language)
	const upcoming = (iso: string | null) =>
		iso && new Date(iso).getTime() > Date.now() ? time(iso) : null

	const stageLabel = {
		closed: t('admin.ordering.stage_closed'),
		open: t('admin.ordering.stage_open'),
		confirmed: t('admin.ordering.stage_confirmed'),
		dinner: t('admin.ordering.stage_dinner'),
		finalized: t('admin.ordering.stage_finalized'),
	}[stage]

	const deadline = upcoming(status.deadline)
	const dinner = upcoming(status.dinnerTime)
	const hint = !isLive
		? null
		: stage === 'open' && deadline && status.autoConfirm
			? t('admin.ordering.hint_auto_confirm', { time: deadline })
			: (stage === 'open' || stage === 'confirmed') && dinner
				? t('admin.ordering.hint_dinner', { time: dinner })
				: null

	const confirm = (next: StoredOrderingStage) => {
		setStage(event.id, next)
		setPending(null)
	}

	return (
		<div className='flex flex-col gap-3 border-t border-border/60 pt-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<span className='text-sm font-medium text-foreground'>
					{t('admin.ordering.title')}
				</span>
				<Badge variant='secondary' className='rounded-full'>
					{stageLabel}
				</Badge>
			</div>
			{hint && <p className='text-xs text-muted-foreground'>{hint}</p>}

			{stored !== 'finalized' && (
				<div className='flex flex-wrap gap-2'>
					{stored === 'closed' && (
						<Button
							type='button'
							disabled={settingStage}
							onClick={() => confirm('open')}
							className='gap-1.5 rounded-full'
						>
							<ShoppingCart className='size-4' />
							{t('admin.ordering.open')}
						</Button>
					)}
					{stored === 'open' && stage === 'open' && (
						<Button
							type='button'
							disabled={settingStage}
							onClick={() => setPending('confirmed')}
							className='gap-1.5 rounded-full'
						>
							<Lock className='size-4' />
							{t('admin.ordering.confirm')}
						</Button>
					)}
					{stored !== 'closed' && (
						<Button
							type='button'
							variant='outline'
							disabled={settingStage}
							onClick={() => setPending('finalized')}
							className='gap-1.5 rounded-full'
						>
							<CheckCircle2 className='size-4' />
							{t('admin.ordering.finalize')}
						</Button>
					)}
				</div>
			)}

			<ConfirmDialog
				open={pending === 'confirmed'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.ordering.confirm_title')}
				description={t('admin.ordering.confirm_body')}
				confirmLabel={t('admin.ordering.confirm')}
				onConfirm={() => confirm('confirmed')}
			/>

			<ConfirmDialog
				open={pending === 'finalized'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.ordering.finalize_title')}
				description={t('admin.ordering.finalize_body')}
				confirmLabel={t('admin.ordering.finalize')}
				onConfirm={() => confirm('finalized')}
			/>
		</div>
	)
}

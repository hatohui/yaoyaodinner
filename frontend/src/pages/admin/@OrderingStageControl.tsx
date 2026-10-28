import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Lock, RotateCcw, ShoppingCart } from 'lucide-react'
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

type PendingStageAction = StoredOrderingStage | 'reopen' | null

export function OrderingStageControl({
	event,
	isLive,
}: OrderingStageControlProps) {
	const { t, i18n } = useTranslation()
	const { setStage, settingStage } = useAdminEvents()
	const status = useOrderingStage()
	const [pending, setPending] = useState<PendingStageAction>(null)

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

	const confirm = (next: StoredOrderingStage, passphrase?: string) => {
		setStage(event.id, next, passphrase)
		setPending(null)
	}

	const showConfirm = stored === 'open' && stage === 'open'
	const showFinalize = stored !== 'closed' && stored !== 'finalized'
	const twoActions = showConfirm && showFinalize

	return (
		<div className='flex flex-col gap-3 px-4 py-3.5'>
			<div className='flex items-center justify-between gap-2'>
				<div className='flex flex-col gap-0.5'>
					<span className='text-sm font-medium text-foreground'>
						{t('admin.ordering.title')}
					</span>
					{hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
				</div>
				<Badge
					variant='secondary'
					className='shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-medium text-primary'
				>
					{stageLabel}
				</Badge>
			</div>

			<div
				className={
					twoActions ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'
				}
			>
				{stored === 'closed' && (
					<Button
						type='button'
						size='sm'
						disabled={settingStage}
						onClick={() => confirm('open')}
						className='h-9 w-full gap-1.5 rounded-xl'
					>
						<ShoppingCart className='size-4' />
						{t('admin.ordering.open')}
					</Button>
				)}
				{showConfirm && (
					<Button
						type='button'
						size='sm'
						disabled={settingStage}
						onClick={() => setPending('confirmed')}
						className='h-9 w-full gap-1.5 rounded-xl'
					>
						<Lock className='size-4' />
						{t('admin.ordering.confirm')}
					</Button>
				)}
				{showFinalize && (
					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled={settingStage}
						onClick={() => setPending('finalized')}
						className='h-9 w-full gap-1.5 rounded-xl'
					>
						<CheckCircle2 className='size-4' />
						{t('admin.ordering.finalize')}
					</Button>
				)}
				{stored === 'finalized' && (
					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled={settingStage}
						onClick={() => setPending('reopen')}
						className='h-9 w-full gap-1.5 rounded-xl'
					>
						<RotateCcw className='size-4' />
						{t('admin.ordering.reopen')}
					</Button>
				)}
			</div>

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

			<ConfirmDialog
				open={pending === 'reopen'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.ordering.reopen_title')}
				description={t('admin.ordering.reopen_body')}
				confirmLabel={t('admin.ordering.reopen')}
				requirePassphrase
				onConfirm={passphrase => confirm('confirmed', passphrase)}
			/>
		</div>
	)
}

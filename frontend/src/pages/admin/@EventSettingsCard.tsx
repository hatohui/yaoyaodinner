import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dices, Radio, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EditableName } from '@/components/common/EditableName'
import { useAdminEvents } from '@/hooks/useAdminEvents'

type PendingAction = 'reroll' | 'activate' | 'delete' | null

export function EventSettingsCard() {
	const { t } = useTranslation()
	const {
		selectedEvent,
		activeEvent,
		rename,
		rerollPin,
		rerolling,
		activate,
		activating,
		remove,
		deleting,
	} = useAdminEvents()

	const [pending, setPending] = useState<PendingAction>(null)

	if (!selectedEvent) return null

	const isLive = selectedEvent.id === activeEvent?.id
	const eventLabel =
		selectedEvent.name || format(new Date(selectedEvent.createdAt), 'PP')

	return (
		<div className='flex flex-col gap-2'>
			<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
				{t('admin.settings.category_event')}
			</p>

			<Card className='flex flex-col gap-4 px-4 py-4'>
				<div className='flex items-center justify-between gap-3'>
					<EditableName
						value={eventLabel}
						onSave={name => rename(selectedEvent.id, name)}
						className='text-sm font-medium text-foreground'
					/>
					{isLive ? (
						<Badge className='shrink-0 gap-1 rounded-full'>
							<Radio className='size-3' />
							{t('admin.event.live')}
						</Badge>
					) : (
						<Badge variant='secondary' className='shrink-0 rounded-full'>
							{t('admin.event.past')}
						</Badge>
					)}
				</div>

				<div className='flex flex-wrap gap-2 border-t border-border/60 pt-4'>
					<Button
						type='button'
						variant='outline'
						disabled={rerolling}
						onClick={() => setPending('reroll')}
						className='gap-1.5 rounded-full'
					>
						<Dices className='size-4' />
						{t('admin.event.reroll_pin')}
					</Button>

					{!isLive && (
						<Button
							type='button'
							variant='outline'
							disabled={activating}
							onClick={() => setPending('activate')}
							className='gap-1.5 rounded-full'
						>
							<Radio className='size-4' />
							{t('admin.event.make_live')}
						</Button>
					)}

					<Button
						type='button'
						variant='outline'
						disabled={deleting}
						onClick={() => setPending('delete')}
						className='gap-1.5 rounded-full text-destructive hover:text-destructive'
					>
						<Trash2 className='size-4' />
						{t('admin.event.delete')}
					</Button>
				</div>
			</Card>

			<ConfirmDialog
				open={pending === 'reroll'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.event.reroll_confirm_title')}
				description={t('admin.event.reroll_confirm_body', {
					pin: selectedEvent.pin,
				})}
				confirmLabel={t('admin.event.reroll_pin')}
				onConfirm={() => {
					rerollPin(selectedEvent.id)
					setPending(null)
				}}
			/>

			<ConfirmDialog
				open={pending === 'activate'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.event.activate_confirm_title')}
				description={t('admin.event.activate_confirm_body', {
					name: eventLabel,
					pin: selectedEvent.pin,
				})}
				confirmLabel={t('admin.event.make_live')}
				onConfirm={() => {
					activate(selectedEvent.id)
					setPending(null)
				}}
			/>

			<ConfirmDialog
				open={pending === 'delete'}
				onOpenChange={open => !open && setPending(null)}
				title={t('admin.event.delete_confirm_title')}
				description={t('admin.event.delete_confirm_body', { name: eventLabel })}
				confirmLabel={t('admin.event.delete')}
				onConfirm={() => {
					remove(selectedEvent.id)
					setPending(null)
				}}
			/>
		</div>
	)
}

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
import { OrderingStageControl } from './@OrderingStageControl'

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
		<div className='flex flex-col gap-1.5'>
			<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
				{t('admin.settings.category_event')}
			</p>

			<Card className='gap-0 divide-y divide-border/60 overflow-hidden rounded-2xl p-0'>
				<div className='flex items-center justify-between gap-3 px-4 py-3.5'>
					<EditableName
						value={eventLabel}
						onSave={name => rename(selectedEvent.id, name)}
						className='text-base font-semibold text-foreground'
					/>
					{isLive ? (
						<Badge className='shrink-0 gap-1 rounded-full px-2.5 py-0.5'>
							<Radio className='size-3' />
							{t('admin.event.live')}
						</Badge>
					) : (
						<Badge
							variant='secondary'
							className='shrink-0 rounded-full px-2.5 py-0.5'
						>
							{t('admin.event.past')}
						</Badge>
					)}
				</div>

				<OrderingStageControl event={selectedEvent} isLive={isLive} />

				<div
					className={
						isLive
							? 'flex flex-wrap gap-2 px-4 py-3.5'
							: 'flex flex-wrap gap-2 px-4 py-3.5'
					}
				>
					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled={rerolling}
						onClick={() => setPending('reroll')}
						className='h-9 min-w-fit flex-1 gap-1.5 whitespace-nowrap rounded-xl'
					>
						<Dices className='size-4 shrink-0 text-primary' />
						{t('admin.event.reroll_pin')}
					</Button>

					{!isLive && (
						<Button
							type='button'
							size='sm'
							variant='outline'
							disabled={activating}
							onClick={() => setPending('activate')}
							className='h-9 min-w-fit flex-1 gap-1.5 whitespace-nowrap rounded-xl'
						>
							<Radio className='size-4 shrink-0 text-primary' />
							{t('admin.event.make_live')}
						</Button>
					)}

					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled={deleting}
						onClick={() => setPending('delete')}
						className='h-9 min-w-fit flex-1 gap-1.5 whitespace-nowrap rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
					>
						<Trash2 className='size-4 shrink-0' />
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
				requirePassphrase
				onConfirm={passphrase => {
					remove(selectedEvent.id, passphrase)
					setPending(null)
				}}
			/>
		</div>
	)
}

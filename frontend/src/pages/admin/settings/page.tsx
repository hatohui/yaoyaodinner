import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { ConfigRow } from './@ConfigRow'
import { useAdminConfig } from './@useAdminConfig'

const CATEGORY_LABELS: Record<string, string> = {
	auth: 'admin.settings.category_auth',
	event: 'admin.settings.category_event',
	orders: 'admin.settings.category_orders',
	tables: 'admin.settings.category_tables',
	feedback: 'admin.settings.category_feedback',
	features: 'admin.settings.category_features',
	banner: 'admin.settings.category_banner',
}

export default function AdminSettingsPage() {
	const { t } = useTranslation()
	const { groups, isLoading, save } = useAdminConfig()
	const { selectedEvent, remove, deleting } = useAdminEvents()
	const [confirmDelete, setConfirmDelete] = useState(false)

	const eventLabel = selectedEvent?.name || selectedEvent?.id || ''

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-0.5'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.settings.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('admin.settings.subtitle')}
				</p>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : groups.length === 0 ? (
				<p className='rounded-2xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground'>
					{t('admin.settings.empty')}
				</p>
			) : (
				groups.map(([category, items]) => (
					<div key={category} className='flex flex-col gap-1.5'>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
							{CATEGORY_LABELS[category]
								? t(CATEGORY_LABELS[category])
								: category}
						</p>
						<Card className='gap-0 divide-y divide-border/60 px-4 py-1'>
							{items.map(item => (
								<ConfigRow key={item.key} item={item} onSave={save} />
							))}
						</Card>
					</div>
				))
			)}

			{selectedEvent && (
				<div className='flex flex-col gap-1.5 pt-4'>
					<p className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive'>
						<AlertTriangle className='size-3.5' />
						{t('admin.settings.category_danger', {
							defaultValue: 'Danger Zone',
						})}
					</p>
					<Card className='gap-3 border-destructive/30 bg-destructive/5 p-4'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
								<span className='font-semibold text-foreground'>
									{t('admin.event.delete_title', {
										defaultValue: 'Delete this event',
									})}
									{eventLabel && ` (${eventLabel})`}
								</span>
								<p className='text-xs text-muted-foreground'>
									{t('admin.event.delete_warning', {
										defaultValue:
											'Permanently remove this event and its tables, orders, and attendees. Requires owner passphrase.',
									})}
								</p>
							</div>
							<Button
								type='button'
								variant='destructive'
								size='sm'
								disabled={deleting}
								onClick={() => setConfirmDelete(true)}
								className='gap-1.5 rounded-full'
							>
								<Trash2 className='size-4' />
								{t('admin.event.delete')}
							</Button>
						</div>
					</Card>
				</div>
			)}

			<ConfirmDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title={t('admin.event.delete_confirm_title')}
				description={t('admin.event.delete_confirm_body', { name: eventLabel })}
				confirmLabel={t('admin.event.delete')}
				requirePassphrase
				onConfirm={passphrase => {
					if (selectedEvent) {
						remove(selectedEvent.id, passphrase)
					}
					setConfirmDelete(false)
				}}
			/>
		</div>
	)
}

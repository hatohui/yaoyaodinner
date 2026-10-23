import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { PinCard } from './@PinCard'
import { EventStatsCards } from './@EventStatsCards'
import { PublishEventDialog } from './@PublishEventDialog'
import { PastEventsList } from './@PastEventsList'
import { EventSettingsCard } from './@EventSettingsCard'
import { ExportOrdersDialog } from './@ExportOrdersDialog'
import { useAdminDashboard } from './@useAdminDashboard'

export default function AdminDashboardPage() {
	const { t } = useTranslation()
	const {
		activeEvent,
		activeLoading,
		pastEvents,
		pastLoading,
		publish,
		publishing,
		copyPin,
	} = useAdminDashboard()

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.dashboard.title')}
				</h1>
				<div className='flex flex-wrap items-center gap-2'>
					{activeEvent && (
						<ExportOrdersDialog
							eventName={activeEvent.name || t('admin.dashboard.unnamed_event')}
						/>
					)}
					<PublishEventDialog
						hasActiveEvent={Boolean(activeEvent)}
						pending={publishing}
						onPublish={name => publish(name ? { name } : {})}
					/>
				</div>
			</div>

			{activeLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : activeEvent ? (
				<div className='flex flex-col gap-4'>
					<PinCard
						pin={activeEvent.pin}
						name={activeEvent.name}
						onCopy={() => copyPin(activeEvent.pin)}
					/>
					<EventStatsCards stats={activeEvent.stats} />
				</div>
			) : (
				<p className='rounded-2xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground'>
					{t('admin.dashboard.no_active_event')}
				</p>
			)}

			<EventSettingsCard />

			<div className='flex flex-col gap-3'>
				<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
					{t('admin.dashboard.past_events')}
				</p>
				<PastEventsList events={pastEvents} isLoading={pastLoading} />
			</div>
		</div>
	)
}

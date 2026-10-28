import { useTranslation } from 'react-i18next'
import { CalendarClock } from 'lucide-react'
import type { EventSummaryDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

interface PastEventsListProps {
	events: EventSummaryDto[]
	isLoading: boolean
	selectedEventId?: string
	onSelectEvent?: (id: string) => void
}

export function PastEventsList({
	events,
	isLoading,
	selectedEventId,
	onSelectEvent,
}: PastEventsListProps) {
	const { t, i18n } = useTranslation()

	if (isLoading) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('common.loading')}
			</p>
		)
	}

	if (events.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-muted-foreground'>
				{t('admin.dashboard.past_events_empty')}
			</p>
		)
	}

	return (
		<ul className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
			{events.map(event => {
				const isSelected = selectedEventId === event.id
				return (
					<li key={event.id}>
						<button
							type='button'
							onClick={() => onSelectEvent?.(event.id)}
							className={cn(
								'flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/40',
								isSelected ? 'border-primary bg-primary/5' : 'border-border/60'
							)}
						>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
									<CalendarClock className='size-4' />
								</div>
								<div className='min-w-0'>
									<p className='truncate font-medium text-foreground'>
										{event.name || t('admin.dashboard.unnamed_event')}
									</p>
									<p className='text-xs text-muted-foreground'>
										{new Date(event.createdAt).toLocaleDateString(
											i18n.language
										)}
									</p>
								</div>
							</div>
							<div className='flex shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground'>
								<span>
									{t('admin.dashboard.stat_tables')}: {event.stats.tables}
								</span>
								<span>
									{t('admin.dashboard.stat_orders')}: {event.stats.orders}
								</span>
							</div>
						</button>
					</li>
				)
			})}
		</ul>
	)
}

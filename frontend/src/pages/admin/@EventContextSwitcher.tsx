import { useTranslation } from 'react-i18next'
import { CalendarClock, Radio } from 'lucide-react'
import { format } from 'date-fns'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAdminEvents } from '@/hooks/useAdminEvents'

export function EventContextSwitcher() {
	const { t } = useTranslation()
	const { events, activeEvent, selectedEvent, isViewingPast, selectEvent } =
		useAdminEvents()

	if (events.length === 0) return null

	return (
		<div className='flex flex-col gap-2 px-1'>
			<p className='flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
				<CalendarClock className='size-3.5' />
				{t('admin.event.context')}
			</p>

			<Select
				value={selectedEvent?.id ?? ''}
				onValueChange={id => selectEvent(id === activeEvent?.id ? null : id)}
			>
				<SelectTrigger className='w-full rounded-full border-border bg-card font-medium shadow-xs dark:border-primary/40 dark:bg-card dark:hover:bg-card'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{events.map(e => (
						<SelectItem key={e.id} value={e.id}>
							<span className='flex items-center gap-2'>
								{e.name || format(new Date(e.createdAt), 'PP')}
								{e.isActive && (
									<Radio className='size-3.5 shrink-0 text-primary' />
								)}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{isViewingPast && (
				<Badge variant='secondary' className='justify-center rounded-full'>
					{t('admin.event.viewing_past')}
				</Badge>
			)}
		</div>
	)
}

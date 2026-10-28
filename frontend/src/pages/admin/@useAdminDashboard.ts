import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetActiveEvent,
	useGetPastEvents,
	usePublishEvent,
	getGetActiveEventQueryKey,
	getGetPastEventsQueryKey,
} from '@/api/events/events'
import {
	getGetTablesQueryKey,
	getGetStagedTablesQueryKey,
} from '@/api/tables/tables'
import type { EventSummaryDto, PublishEventDto } from '@/api/model'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'

export function useAdminDashboard() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { selectedEvent } = useAdminEvents()

	const { data: activeEvent, isLoading: activeLoading } =
		useGetActiveEvent<EventSummaryDto | null>()
	const { data: pastEvents = [], isLoading: pastLoading } =
		useGetPastEvents<EventSummaryDto[]>()

	const { mutate, isPending: publishing } = usePublishEvent({
		mutation: {
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: getGetActiveEventQueryKey() })
				qc.invalidateQueries({ queryKey: getGetPastEventsQueryKey() })
				qc.invalidateQueries({ queryKey: getGetTablesQueryKey() })
				qc.invalidateQueries({ queryKey: getGetStagedTablesQueryKey() })
				toast.success(t('admin.dashboard.published'))
			},
			onError: () => toast.error(t('admin.dashboard.publish_failed')),
		},
	})

	const publish = (dto: PublishEventDto) => mutate({ data: dto })

	const copyPin = async (pin: string) => {
		await navigator.clipboard.writeText(pin)
		toast.success(t('admin.dashboard.pin_copied'))
	}

	return {
		activeEvent: activeEvent ?? null,
		selectedEvent,
		activeLoading,
		pastEvents,
		pastLoading,
		publish,
		publishing,
		copyPin,
	}
}

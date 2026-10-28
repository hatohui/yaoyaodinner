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
import { useGetPopularItems, useGetTableTotals } from '@/api/stats/stats'
import type {
	EventSummaryDto,
	PopularItemDto,
	PublishEventDto,
	TableTotalDto,
} from '@/api/model'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'

export function useAdminDashboard() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { selectedEvent, scopedEventId, selectEvent } = useAdminEvents()

	const { data: activeEvent, isLoading: activeLoading } =
		useGetActiveEvent<EventSummaryDto | null>()
	const { data: pastEvents = [], isLoading: pastLoading } =
		useGetPastEvents<EventSummaryDto[]>()

	const { data: popular = [], isLoading: popularLoading } = useGetPopularItems<
		PopularItemDto[]
	>({
		scope: 'event',
		lang: i18n.language,
		eventId: scopedEventId,
		limit: 5,
	})

	const { data: tableTotals = [], isLoading: totalsLoading } =
		useGetTableTotals<TableTotalDto[]>({ eventId: scopedEventId })

	const totalSpend = tableTotals.reduce((sum, row) => sum + row.total, 0)
	const activeTablesCount = tableTotals.filter(row => row.total > 0).length
	const avgPerTable = activeTablesCount > 0 ? totalSpend / activeTablesCount : 0

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
		selectEvent,
		activeLoading,
		pastEvents,
		pastLoading,
		popular,
		popularLoading,
		tableTotals,
		totalsLoading,
		totalSpend,
		avgPerTable,
		publish,
		publishing,
		copyPin,
	}
}

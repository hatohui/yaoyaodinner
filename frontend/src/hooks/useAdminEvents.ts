import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetActiveEvent,
	useGetPastEvents,
	useUpdateEvent,
	useRerollEventPin,
	useActivateEvent,
	useDeleteEvent,
	getGetActiveEventQueryKey,
	getGetPastEventsQueryKey,
} from '@/api/events/events'
import type { EventSummaryDto } from '@/api/model'
import { useAdminEvent } from '@/hooks/useAdminEvent'
import { useToast } from '@/hooks/useToast'

export function useAdminEvents() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const selectedId = useAdminEvent(s => s.eventId)
	const setEventId = useAdminEvent(s => s.setEventId)

	const { data: activeEvent } = useGetActiveEvent<EventSummaryDto | null>()
	const { data: pastEvents = [] } = useGetPastEvents<EventSummaryDto[]>()

	const events = useMemo(
		() => (activeEvent ? [activeEvent, ...pastEvents] : pastEvents),
		[activeEvent, pastEvents]
	)

	const selectedEvent = useMemo(
		() => events.find(e => e.id === selectedId) ?? activeEvent ?? null,
		[events, selectedId, activeEvent]
	)

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: getGetActiveEventQueryKey() })
		qc.invalidateQueries({ queryKey: getGetPastEventsQueryKey() })
	}

	const onError = () => toast.error(t('admin.event.action_failed'))

	const { mutate: renameMutate, isPending: renaming } = useUpdateEvent({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.event.renamed'))
			},
			onError,
		},
	})

	const { mutate: rerollMutate, isPending: rerolling } = useRerollEventPin({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.event.pin_rerolled'))
			},
			onError,
		},
	})

	const { mutate: activateMutate, isPending: activating } = useActivateEvent({
		mutation: {
			onSuccess: event => {
				setEventId(null)
				qc.invalidateQueries()
				toast.success(
					t('admin.event.activated', {
						name: event?.name || t('admin.event.untitled'),
					})
				)
			},
			onError,
		},
	})

	const { mutate: deleteMutate, isPending: deleting } = useDeleteEvent({
		mutation: {
			onSuccess: () => {
				setEventId(null)
				qc.invalidateQueries()
				toast.success(t('admin.event.deleted'))
			},
			onError,
		},
	})

	return {
		events,
		activeEvent: activeEvent ?? null,
		selectedEvent,
		/** undefined when viewing the live event, so queries stay on the default key */
		scopedEventId:
			selectedEvent && selectedEvent.id !== activeEvent?.id
				? selectedEvent.id
				: undefined,
		isViewingPast: Boolean(
			selectedEvent && activeEvent && selectedEvent.id !== activeEvent.id
		),
		selectEvent: setEventId,
		rename: (id: string, name: string) => renameMutate({ id, data: { name } }),
		renaming,
		rerollPin: (id: string) => rerollMutate({ id }),
		rerolling,
		activate: (id: string) => activateMutate({ id }),
		activating,
		remove: (id: string) => deleteMutate({ id }),
		deleting,
	}
}

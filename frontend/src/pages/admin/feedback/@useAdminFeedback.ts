import { keepPreviousData } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useGetFeedbackByEvent } from '@/api/feedback/feedback'
import type {
	GetFeedbackResponseDto,
	GetFeedbackByEventSort,
} from '@/api/model'
import { usePagination } from '@/hooks/usePagination'
import { useAdminEvents } from '@/hooks/useAdminEvents'

export function useAdminFeedback() {
	const { selectedEvent } = useAdminEvents()

	const [sort, setSort] = useState<GetFeedbackByEventSort>('recent')
	const [total, setTotal] = useState(0)
	const pagination = usePagination({ total, initialCount: 20 })

	const eventId = selectedEvent?.id ?? null

	const { data, isLoading } = useGetFeedbackByEvent<GetFeedbackResponseDto>(
		{
			eventId: eventId ?? '',
			page: pagination.page,
			count: pagination.count,
			sort,
		},
		{ query: { enabled: Boolean(eventId), placeholderData: keepPreviousData } }
	)

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	return {
		sort,
		setSort,
		pagination,
		feedback: data?.feedback ?? [],
		isLoading,
	}
}

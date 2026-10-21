import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetPopularItems, useGetTableTotals } from '@/api/stats/stats'
import type { PopularItemDto, TableTotalDto } from '@/api/model'
import { useAdminEvents } from '@/hooks/useAdminEvents'

export function useAdminStats() {
	const { i18n } = useTranslation()
	const [scope, setScope] = useState<'event' | 'all'>('event')
	const { scopedEventId } = useAdminEvents()

	const { data: popular = [], isLoading: popularLoading } = useGetPopularItems<
		PopularItemDto[]
	>({ scope, lang: i18n.language, eventId: scopedEventId })

	const [allOpen, setAllOpen] = useState(false)
	const { data: allOrdered = [], isLoading: allLoading } = useGetPopularItems<
		PopularItemDto[]
	>(
		{ scope, lang: i18n.language, eventId: scopedEventId, limit: 0 },
		{ query: { enabled: allOpen } }
	)

	const { data: tableTotals = [], isLoading: totalsLoading } =
		useGetTableTotals<TableTotalDto[]>({ eventId: scopedEventId })

	return {
		scope,
		setScope,
		popular,
		popularLoading,
		allOpen,
		setAllOpen,
		allOrdered,
		allLoading,
		tableTotals,
		totalsLoading,
	}
}

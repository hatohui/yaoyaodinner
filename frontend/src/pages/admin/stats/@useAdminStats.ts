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
	>({ scope, lang: i18n.language, eventId: scopedEventId, limit: 0 })

	const { data: tableTotals = [], isLoading: totalsLoading } =
		useGetTableTotals<TableTotalDto[]>({ eventId: scopedEventId })

	const totalSpend = tableTotals.reduce((sum, row) => sum + row.total, 0)
	const activeTablesCount = tableTotals.filter(row => row.total > 0).length
	const avgPerTable = activeTablesCount > 0 ? totalSpend / activeTablesCount : 0
	const outliersCount = tableTotals.filter(row => row.isOutlier).length
	const sourceItems = allOrdered.length > 0 ? allOrdered : popular
	const totalOrderedCount = sourceItems.reduce(
		(sum, item) => sum + item.count,
		0
	)
	const uniqueDishesCount = sourceItems.length
	const topItem = popular[0] ?? null

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
		totalSpend,
		activeTablesCount,
		avgPerTable,
		outliersCount,
		totalOrderedCount,
		uniqueDishesCount,
		topItem,
	}
}

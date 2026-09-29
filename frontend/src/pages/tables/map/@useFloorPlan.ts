import { useGetTables } from '@/api/tables/tables'
import type { TableListDto } from '@/api/model'
import { isOnMap } from '@/components/floor-plan/layout'

export function useFloorPlan() {
	const { data, isLoading, isError } = useGetTables<TableListDto>({
		count: 100,
	})

	const positioned = (data?.tables ?? []).filter(isOnMap)

	return { tables: positioned, isLoading, isError }
}

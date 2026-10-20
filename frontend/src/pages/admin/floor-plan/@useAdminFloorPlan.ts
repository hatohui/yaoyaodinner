import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
	useCreateTable,
	useGetTables,
	useUpdateTablePosition,
	getGetTablesQueryKey,
} from '@/api/tables/tables'
import type { TableListDto } from '@/api/model'

const PARAMS = { count: 100 }

export function useAdminFloorPlan() {
	const { t } = useTranslation()
	const qc = useQueryClient()
	const queryKey = getGetTablesQueryKey(PARAMS)
	const { data, isLoading, isError } = useGetTables<TableListDto>(PARAMS)

	const tables = data?.tables ?? []

	const { mutate } = useUpdateTablePosition({
		mutation: {
			meta: { ownErrorToast: true },
			onMutate: async ({ id, data: { x, y } }) => {
				await qc.cancelQueries({ queryKey })
				const previous = qc.getQueryData<TableListDto>(queryKey)
				qc.setQueryData<TableListDto>(
					queryKey,
					old =>
						old && {
							...old,
							tables: old.tables.map(table =>
								table.id === id ? { ...table, x, y } : table
							),
						}
				)
				return { previous }
			},
			onError: (_error, { id }, context) => {
				if (context?.previous) qc.setQueryData(queryKey, context.previous)
				const name = tables.find(table => table.id === id)?.name ?? ''
				toast.error(t('admin.floor_plan.save_error', { name }))
			},
			onSettled: () => qc.invalidateQueries({ queryKey }),
		},
	})

	const { mutate: create, isPending: creating } = useCreateTable({
		mutation: {
			meta: { ownErrorToast: true },
			onSuccess: () => {
				qc.invalidateQueries({ queryKey })
				toast.success(t('admin.tables.created'))
			},
			onError: () => toast.error(t('admin.tables.create_failed')),
		},
	})

	const placeTable = (id: string, x: number, y: number) =>
		mutate({ id, data: { x, y } })

	const removeFromMap = (id: string) =>
		mutate({ id, data: { x: null, y: null } })

	const createTable = (name: string, capacity: number, isStaging: boolean) =>
		create({ data: { name, capacity, isStaging } })

	return {
		tables,
		isLoading,
		isError,
		placeTable,
		removeFromMap,
		createTable,
		creating,
	}
}

import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetTableById,
	useUpdateTableDetails,
	getGetTableByIdQueryKey,
	getGetTablesQueryKey,
} from '@/api/tables/tables'
import { useToast } from '@/hooks/useToast'
import type { TableDto, UpdateTableDetailsDto } from '@/api/model'

export function useTableDetail() {
	const { id = '' } = useParams()
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const { data: table, isLoading, isError } = useGetTableById<TableDto>(id)

	const tableKey = getGetTableByIdQueryKey(id)

	const { mutate: updateMutate } = useUpdateTableDetails({
		mutation: {
			onMutate: async ({ data: patch }) => {
				await qc.cancelQueries({ queryKey: tableKey })
				const prev = qc.getQueryData<TableDto>(tableKey)
				if (prev) qc.setQueryData<TableDto>(tableKey, { ...prev, ...patch })
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(tableKey, ctx?.prev)
				toast.error(t('roster.update_failed'))
			},
			onSettled: () => {
				qc.invalidateQueries({ queryKey: tableKey })
				qc.invalidateQueries({ queryKey: getGetTablesQueryKey() })
			},
		},
	})

	const shareLink = () => {
		navigator.clipboard?.writeText(window.location.href)
		toast.success(t('roster.link_copied'))
	}

	return {
		id,
		table,
		isLoading,
		isError,
		shareLink,
		updateTable: (patch: UpdateTableDetailsDto) =>
			updateMutate({ id, data: patch }),
	}
}

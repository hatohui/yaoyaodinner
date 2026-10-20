import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetTables,
	useGetStagedTables,
	useCreateTable,
	useBulkCreateTables,
	useDeleteTable,
	useBulkDeleteTables,
	useReassignTables,
	useGetTableCodes,
	useRerollTableCodes,
	getGetTableCodesQueryKey,
	useUpdateTable,
	getGetTablesQueryKey,
	getGetStagedTablesQueryKey,
} from '@/api/tables/tables'
import type { TableCodeResponseDto, TableDto, TableListDto } from '@/api/model'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { useAdminEvents } from '@/hooks/useAdminEvents'

export function useAdminTables() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()

	const [search, setSearch] = useState('')
	const [total, setTotal] = useState(0)
	const debouncedSearch = useDebounce(search, 300)
	const pagination = usePagination({ total, initialCount: 12 })
	const { scopedEventId, isViewingPast } = useAdminEvents()

	const { data, isLoading: liveLoading } = useGetTables<TableListDto>({
		page: pagination.page,
		count: pagination.count,
		search: debouncedSearch || undefined,
		eventId: scopedEventId,
	})
	const liveTables = data?.tables ?? []

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const { data: stagedTables = [], isLoading: stagedLoading } =
		useGetStagedTables<TableDto[]>()

	const { data: codeRows = [] } = useGetTableCodes<TableCodeResponseDto[]>()
	const codes = Object.fromEntries(codeRows.map(c => [c.id, c.code]))

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: getGetTablesQueryKey() })
		qc.invalidateQueries({ queryKey: getGetStagedTablesQueryKey() })
	}

	const { mutate: createTable, isPending: creating } = useCreateTable({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.created'))
			},
			onError: () => toast.error(t('admin.tables.create_failed')),
		},
	})

	const { mutate: bulkCreate, isPending: bulkCreating } = useBulkCreateTables({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.bulk_created'))
			},
			onError: () => toast.error(t('admin.tables.create_failed')),
		},
	})

	const { mutate: deleteTable } = useDeleteTable({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.deleted'))
			},
			onError: () => toast.error(t('admin.tables.delete_failed')),
		},
	})

	const { mutate: bulkDelete } = useBulkDeleteTables({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.deleted'))
			},
			onError: () => toast.error(t('admin.tables.delete_failed')),
		},
	})

	const tablesKey = getGetTablesQueryKey()

	const { mutate: updateTableMutate } = useUpdateTable({
		mutation: {
			onMutate: async ({ id, data: patch }) => {
				await qc.cancelQueries({ queryKey: tablesKey })
				const prev = qc.getQueryData<TableListDto>(tablesKey)
				if (prev)
					qc.setQueryData<TableListDto>(tablesKey, {
						...prev,
						tables: prev.tables.map(tb =>
							tb.id === id ? { ...tb, ...patch } : tb
						),
					})
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(tablesKey, ctx?.prev)
				toast.error(t('admin.tables.rename_failed'))
			},
			onSettled: invalidate,
		},
	})

	const { mutate: reassign } = useReassignTables({
		mutation: {
			onSuccess: () => {
				invalidate()
				toast.success(t('admin.tables.moved_to_staging'))
			},
			onError: () => toast.error(t('admin.tables.delete_failed')),
		},
	})

	const { mutate: rerollCodes } = useRerollTableCodes({
		mutation: {
			onSuccess: fresh => {
				qc.setQueryData<TableCodeResponseDto[]>(
					getGetTableCodesQueryKey(),
					prev => (prev ?? []).map(c => fresh.find(f => f.id === c.id) ?? c)
				)
				toast.success(t('admin.tables.codes_rerolled'))
			},
			onError: () => toast.error(t('admin.tables.reroll_failed')),
		},
	})

	return {
		codes,
		search,
		setSearch,
		pagination,
		isViewingPast,
		liveTables,
		liveLoading,
		stagedTables,
		stagedLoading,
		creating,
		bulkCreating,
		createTable: (name: string, capacity: number, isStaging: boolean) =>
			createTable({ data: { name, capacity, isStaging } }),
		bulkCreate: (count: number, capacity: number, isStaging: boolean) =>
			bulkCreate({ data: { count, capacity, isStaging } }),
		removeTable: (id: string) => deleteTable({ id }),
		renameTable: (id: string, name: string) =>
			updateTableMutate({ id, data: { name } }),
		updateCapacity: (id: string, capacity: number) =>
			updateTableMutate({ id, data: { capacity } }),
		bulkRemoveTables: (ids: string[]) => bulkDelete({ data: { ids } }),
		rerollCodes: (ids: string[]) => rerollCodes({ data: { ids } }),
		moveToStaging: (ids: string[]) =>
			reassign({ data: { ids, eventId: null } }),
	}
}

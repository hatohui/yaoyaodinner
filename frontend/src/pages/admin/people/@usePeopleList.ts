import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useGetPeopleList, getGetPeopleListQueryKey } from '@/api/stats/stats'
import { useUpdatePerson, useMovePeople } from '@/api/people/people'
import { useUpsertNote } from '@/api/personal-notes/personal-notes'
import { useGetTables } from '@/api/tables/tables'
import type { PeopleListDto, PersonRowDto, TableListDto } from '@/api/model'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'

export function usePeopleList() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const [search, setSearch] = useState('')
	const [total, setTotal] = useState(0)
	const debouncedSearch = useDebounce(search, 300)
	const pagination = usePagination({ total, initialCount: 20 })
	const { scopedEventId } = useAdminEvents()

	const listParams = {
		page: pagination.page,
		count: pagination.count,
		search: debouncedSearch || undefined,
		lang: i18n.language,
		eventId: scopedEventId,
	}
	const listKey = getGetPeopleListQueryKey(listParams)

	const { data, isLoading, isError } =
		useGetPeopleList<PeopleListDto>(listParams)

	const { data: tablesData } = useGetTables<TableListDto>({
		count: 100,
		eventId: scopedEventId,
	})
	const tableOptions = useMemo(
		() =>
			(tablesData?.tables ?? []).map(tb => ({ label: tb.name, value: tb.id })),
		[tablesData?.tables]
	)

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const patchRow = async (
		id: string,
		apply: (row: PersonRowDto) => PersonRowDto
	) => {
		await qc.cancelQueries({ queryKey: listKey })
		const prev = qc.getQueryData<PeopleListDto>(listKey)
		if (prev)
			qc.setQueryData<PeopleListDto>(listKey, {
				...prev,
				people: prev.people.map(p => (p.id === id ? apply(p) : p)),
			})
		return { prev }
	}

	const rollback = (ctx?: { prev?: PeopleListDto }) => {
		if (ctx?.prev) qc.setQueryData(listKey, ctx.prev)
		toast.error(t('admin.people.update_failed'))
	}

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: getGetPeopleListQueryKey() })

	const { mutate: updatePersonMutate } = useUpdatePerson({
		mutation: {
			onMutate: ({ id, data: patch }) =>
				patchRow(id, p => ({ ...p, ...patch })),
			onError: (_e, _v, ctx) => rollback(ctx),
			onSettled: invalidate,
		},
	})

	const { mutate: movePeopleMutate } = useMovePeople({
		mutation: {
			onMutate: ({ data: { ids, tableId } }) => {
				const table = tableOptions.find(tb => tb.value === tableId)
				return patchRow(ids[0], p => ({
					...p,
					tableId,
					tableName: table?.label ?? p.tableName,
				}))
			},
			onError: (_e, _v, ctx) => rollback(ctx),
			onSettled: invalidate,
		},
	})

	const { mutate: upsertNoteMutate } = useUpsertNote({
		mutation: {
			onMutate: ({ data: { personId, content } }) =>
				patchRow(personId, p => ({ ...p, note: content })),
			onError: (_e, _v, ctx) => {
				if (ctx?.prev) qc.setQueryData(listKey, ctx.prev)
				toast.error(t('admin.people.note_save_failed'))
			},
			onSettled: invalidate,
		},
	})

	const people = data?.people ?? []

	const onDataChange = (updated: PersonRowDto[]) => {
		for (const next of updated) {
			const prev = people.find(p => p.id === next.id)
			if (!prev) continue

			if (prev.name !== next.name) {
				updatePersonMutate({ id: next.id, data: { name: next.name } })
			}
			if (prev.tableId !== next.tableId && next.tableId) {
				movePeopleMutate({ data: { ids: [next.id], tableId: next.tableId } })
			}
			const note = next.note?.trim() ?? ''
			if ((prev.note ?? '') !== note) {
				upsertNoteMutate({ data: { personId: next.id, content: note } })
			}
		}
	}

	return {
		search,
		setSearch,
		pagination,
		people,
		tableOptions,
		onDataChange,
		isLoading,
		isError,
	}
}

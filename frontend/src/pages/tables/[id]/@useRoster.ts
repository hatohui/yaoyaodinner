import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
	useCreatePerson,
	useDeletePerson,
	useUpdatePerson,
	useUpdatePersonPfp,
} from '@/api/people/people'
import {
	useGetTablePeople,
	getGetTablePeopleQueryKey,
	getGetTableByIdQueryKey,
	getGetTablesQueryKey,
} from '@/api/tables/tables'
import { useToast } from '@/hooks/useToast'
import type { PersonDto } from '@/api/model'

export function useRoster(tableId: string) {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const peopleKey = getGetTablePeopleQueryKey(tableId)
	const tableKey = getGetTableByIdQueryKey(tableId)

	const { data, isLoading } = useGetTablePeople<PersonDto[]>(tableId)

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: peopleKey })
		qc.invalidateQueries({ queryKey: tableKey })
		// occupancy badges live in the tables list (search, floor plan, picker)
		qc.invalidateQueries({ queryKey: getGetTablesQueryKey() })
	}

	const addMutation = useCreatePerson({
		mutation: {
			onMutate: async ({ data: body }) => {
				await qc.cancelQueries({ queryKey: peopleKey })
				const prev = qc.getQueryData<PersonDto[]>(peopleKey)
				const optimistic: PersonDto = {
					id: `temp-${Date.now()}`,
					name: body.name,
					tableId,
					eventId: null,
				}
				qc.setQueryData<PersonDto[]>(peopleKey, old => [
					...(old ?? []),
					optimistic,
				])
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(peopleKey, ctx?.prev)
				toast.error(t('roster.add_failed'))
			},
			onSettled: invalidate,
		},
	})

	const removeMutation = useDeletePerson({
		mutation: {
			onMutate: async ({ id }) => {
				await qc.cancelQueries({ queryKey: peopleKey })
				const prev = qc.getQueryData<PersonDto[]>(peopleKey)
				qc.setQueryData<PersonDto[]>(peopleKey, old =>
					(old ?? []).filter(p => p.id !== id)
				)
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(peopleKey, ctx?.prev)
				toast.error(t('roster.remove_failed'))
			},
			onSettled: invalidate,
		},
	})

	const pfpMutation = useUpdatePersonPfp({
		mutation: {
			onMutate: async ({ id, data: body }) => {
				await qc.cancelQueries({ queryKey: peopleKey })
				const prev = qc.getQueryData<PersonDto[]>(peopleKey)
				qc.setQueryData<PersonDto[]>(peopleKey, old =>
					(old ?? []).map(p =>
						p.id === id ? { ...p, pfpUrl: body.pfpUrl ?? null } : p
					)
				)
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(peopleKey, ctx?.prev)
				toast.error(t('roster.update_failed'))
			},
			onSettled: invalidate,
		},
	})

	const renameMutation = useUpdatePerson({
		mutation: {
			onMutate: async ({ id, data: body }) => {
				await qc.cancelQueries({ queryKey: peopleKey })
				const prev = qc.getQueryData<PersonDto[]>(peopleKey)
				qc.setQueryData<PersonDto[]>(peopleKey, old =>
					(old ?? []).map(p =>
						p.id === id ? { ...p, name: body.name ?? p.name } : p
					)
				)
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(peopleKey, ctx?.prev)
				toast.error(t('roster.update_failed'))
			},
			onSettled: invalidate,
		},
	})

	const add = (name: string) => {
		const trimmed = name.trim()
		if (!trimmed) return
		addMutation.mutate({ data: { name: trimmed, tableId } })
	}

	const remove = (id: string) => removeMutation.mutate({ id })

	const updatePfp = (id: string, pfpUrl: string | null) =>
		pfpMutation.mutate({ id, data: { pfpUrl } })

	const rename = (id: string, name: string) =>
		renameMutation.mutate({ id, data: { name } })

	return { people: data ?? [], isLoading, add, remove, updatePfp, rename }
}

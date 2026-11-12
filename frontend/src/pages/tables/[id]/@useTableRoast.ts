import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	getGetTableRoastQueryKey,
	useGetTableRoast,
	useRoastTable,
	useRoastTablePerson,
} from '@/api/tables/tables'
import { clearTableRoast } from '@/api/roast'
import type {
	MemberRoastDto,
	RoastTableDtoLang,
	TableRoastStateDto,
} from '@/api/model'
import { useToast } from '@/hooks/useToast'

export function useTableRoast(tableId: string, enabled: boolean) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const params = { lang: i18n.language }
	const body = { lang: i18n.language as RoastTableDtoLang }

	const { data, isLoading } = useGetTableRoast<TableRoastStateDto>(
		tableId,
		params,
		{ query: { enabled: enabled && Boolean(tableId) } }
	)

	const onSuccess = (state: TableRoastStateDto) =>
		qc.setQueryData(getGetTableRoastQueryKey(tableId, params), state)
	const onError = (err: unknown) =>
		toast.error(
			isAxiosError(err) && err.response?.status === 429
				? t('roast.too_soon')
				: t('roast.failed')
		)

	const { mutate: roastTable, isPending: isRoastingTable } = useRoastTable({
		mutation: { onSuccess, onError },
	})
	const {
		mutate: roastPerson,
		isPending: isRoastingPerson,
		variables: personVariables,
	} = useRoastTablePerson({ mutation: { onSuccess, onError } })

	const members = React.useMemo(
		() =>
			Object.fromEntries(
				(data?.members ?? []).map(m => [m.personId, m])
			) as Record<string, MemberRoastDto>,
		[data?.members]
	)

	const [isClearing, setIsClearing] = React.useState(false)

	const clearRoast = async () => {
		try {
			setIsClearing(true)
			await clearTableRoast(tableId)
			await qc.invalidateQueries({ queryKey: getGetTableRoastQueryKey(tableId, params) })
			toast.success(t('roast.clear_success', 'Roasts cleared'))
		} catch {
			toast.error(t('roast.clear_failed', 'Failed to clear roasts'))
		} finally {
			setIsClearing(false)
		}
	}

	return {
		tableRoast: data?.table ?? null,
		members,
		isLoading,
		isRoastingTable,
		isClearing,
		roastingPersonId: isRoastingPerson ? personVariables?.personId : undefined,
		roastTable: () => roastTable({ id: tableId, data: body }),
		roastPerson: (personId: string) =>
			roastPerson({ id: tableId, personId, data: body }),
		clearRoast,
	}
}

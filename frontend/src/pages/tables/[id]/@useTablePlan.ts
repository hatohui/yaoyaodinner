import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	clearTablePlan,
	getGetTablePlanQueryKey,
	useGetTablePlan,
	usePlanTable,
} from '@/api/tables/tables'
import { applyOrderChanges, getGetOrdersQueryKey } from '@/api/orders/orders'
import type {
	PlanTableDto,
	PlanTableDtoLang,
	TablePlanItemDto,
	TablePlanStateDto,
} from '@/api/model'
import { useToast } from '@/hooks/useToast'
import { isAiLimit } from '@/utils/aiLimit'
import type { PlanChanges } from './@planChanges'

const POLL_MS = 2_500

export type PlanRequest = Omit<PlanTableDto, 'lang' | 'dismiss'>

export function useTablePlan(tableId: string) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const params = { lang: i18n.language }
	const lang = i18n.language as PlanTableDtoLang

	const { data, isLoading } = useGetTablePlan<TablePlanStateDto>(
		tableId,
		params,
		{
			query: {
				enabled: Boolean(tableId),
				refetchInterval: query =>
					query.state.data?.status === 'pending' ? POLL_MS : false,
			},
		}
	)

	const { mutate, isPending } = usePlanTable({
		mutation: {
			onSuccess: state =>
				qc.setQueryData(getGetTablePlanQueryKey(tableId, params), state),
			onError: err =>
				toast.error(
					isAiLimit(err)
						? t('ai_limit')
						: isAxiosError(err) && err.response?.status === 429
							? t('table_plan.too_soon')
							: t('table_plan.failed')
				),
		},
	})

	const [isAccepting, setIsAccepting] = useState(false)

	/**
	 * Orders a fresh plan for the whole table, or applies a modified one to what is
	 * already ordered, then clears it so nobody applies it twice.
	 */
	const acceptPlan = async (
		items: TablePlanItemDto[],
		changes: PlanChanges | null
	) => {
		setIsAccepting(true)
		try {
			// one call, so the table gets every change or none of them
			await applyOrderChanges({
				tableId,
				adds: changes
					? changes.adds
					: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
				cuts: changes?.cuts ?? [],
			})
			// the orders are in; a plan left behind only risks a second order
			await clearTablePlan(tableId).catch(() => undefined)
			qc.setQueryData<TablePlanStateDto>(
				getGetTablePlanQueryKey(tableId, params),
				{ status: 'idle', plan: null, position: null }
			)
			toast.success(
				changes
					? t('table_plan.applied', { count: changes.count })
					: t('table_plan.ordered', { count: items.length })
			)
			return true
		} catch {
			toast.error(t('orders.place_failed'))
			return false
		} finally {
			setIsAccepting(false)
			qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() })
		}
	}

	return {
		status: data?.status ?? 'idle',
		plan: data?.plan ?? null,
		position: data?.position ?? null,
		isLoading,
		isPlanning: isPending || data?.status === 'pending',
		requestPlan: (request: PlanRequest) =>
			mutate({ id: tableId, data: { lang, ...request } }),
		acceptPlan,
		isAccepting,
		dismissRestriction: (restrictionId: string) =>
			mutate({ id: tableId, data: { lang, dismiss: [restrictionId] } }),
	}
}
